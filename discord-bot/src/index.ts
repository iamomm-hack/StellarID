/**
 * StellarID v2.0.0 — Discord Reputation Gating Bot
 * ====================================================
 * Synchronizes StellarID builder tiers with Discord server roles,
 * handles /verify, /profile, /leaderboard, and /gate commands.
 *
 * @version 2.0.0
 * @module discord-bot/index
 */

import { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ActivityType } from 'discord.js';
import express from 'express';
import { Pool } from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const token = process.env.DISCORD_TOKEN;
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5555/api/v1';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const port = process.env.PORT || 4000;

if (!token) {
  console.error('Error: DISCORD_TOKEN is not defined in .env');
  process.exit(1);
}

// 1. Initialize DB Pool
const isNeon = process.env.DATABASE_URL?.includes('neon.tech');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || isNeon) ? { rejectUnauthorized: false } : undefined,
});

// 2. Initialize Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// 3. Express App for Webhook
const app = express();
app.use(express.json());

// Helper function to sync roles in all guilds
async function syncUserRoles(discordId: string): Promise<boolean> {
  try {
    // Call backend endpoint to get user reputation details
    const response = await axios.get(`${backendUrl}/reputation/discord/user/${discordId}`);
    const data = response.data;

    if (!data.verified) {
      console.log(`[Role Sync] User ${discordId} is not linked to any wallet.`);
      // Remove all roles from all servers
      await removeAllStellarRoles(discordId);
      return false;
    }

    const { tier } = data;
    console.log(`[Role Sync] Syncing user ${discordId} with tier: ${tier}`);

    // Update roles in all guilds the bot has access to
    const guilds = client.guilds.cache;
    for (const [_, guild] of guilds) {
      try {
        const member = await guild.members.fetch(discordId).catch(() => null);
        if (!member) continue; // User not in this guild

        const rolesToEnsure = ['Stellar Bronze', 'Stellar Silver', 'Stellar Gold', 'Stellar Platinum'];
        const roleCache: Record<string, any> = {};

        // Find or create roles dynamically
        for (const rName of rolesToEnsure) {
          let role = guild.roles.cache.find((r) => r.name === rName);
          if (!role) {
            const tierColor = rName.includes('Bronze')
              ? '#CD7F32'
              : rName.includes('Silver')
              ? '#C0C0C0'
              : rName.includes('Gold')
              ? '#FFD700'
              : '#E5E4E2';

            role = await guild.roles.create({
              name: rName,
              color: tierColor as any,
              reason: 'StellarID Gating Role creation',
            });
          }
          roleCache[rName] = role;
        }

        // Map tier name to target role name
        let targetRoleName: string | null = null;
        if (tier === 'Bronze') targetRoleName = 'Stellar Bronze';
        else if (tier === 'Silver') targetRoleName = 'Stellar Silver';
        else if (tier === 'Gold') targetRoleName = 'Stellar Gold';
        else if (tier === 'Platinum') targetRoleName = 'Stellar Platinum';

        // Remove old tier roles
        for (const rName of rolesToEnsure) {
          if (member.roles.cache.has(roleCache[rName].id) && rName !== targetRoleName) {
            await member.roles.remove(roleCache[rName]);
          }
        }

        // Add the correct tier role
        if (targetRoleName) {
          const targetRole = roleCache[targetRoleName];
          if (!member.roles.cache.has(targetRole.id)) {
            await member.roles.add(targetRole);
            console.log(`[Role Sync] Added ${targetRoleName} to user ${member.user.tag} in guild ${guild.name}`);
          }
        }
      } catch (err: any) {
        console.error(`Error syncing roles in guild ${guild.name}:`, err.message);
      }
    }

    return true;
  } catch (err: any) {
    console.error('Error syncing user roles:', err.message);
    return false;
  }
}

// Helper to remove all roles if they unlinked or aren't verified
async function removeAllStellarRoles(discordId: string) {
  const guilds = client.guilds.cache;
  const rolesToEnsure = ['Stellar Bronze', 'Stellar Silver', 'Stellar Gold', 'Stellar Platinum'];

  for (const [_, guild] of guilds) {
    try {
      const member = await guild.members.fetch(discordId).catch(() => null);
      if (!member) continue;

      for (const rName of rolesToEnsure) {
        const role = guild.roles.cache.find((r) => r.name === rName);
        if (role && member.roles.cache.has(role.id)) {
          await member.roles.remove(role);
        }
      }
    } catch (err: any) {
      console.error(`Error removing roles in guild ${guild.name}:`, err.message);
    }
  }
}

// Webhook endpoint to receive link alerts from backend
app.post('/api/bot/sync-user', async (req, res) => {
  const authHeader = req.headers.authorization;
  const botSecret = process.env.DISCORD_BOT_API_SECRET || 'stellarid_bot_secret';

  if (authHeader !== `Bearer ${botSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { discord_id } = req.body;
  if (!discord_id) {
    res.status(400).json({ error: 'Missing discord_id' });
    return;
  }

  const success = await syncUserRoles(discord_id);
  if (success) {
    res.json({ success: true, message: 'Synced' });
  } else {
    res.status(400).json({ error: 'Failed to sync user' });
  }
});

// Start Express server
app.listen(port, () => {
  console.log(`[Web Receiver] Listening for backend notifications on port ${port}`);
});

// 4. Handle Bot Ready
client.once('ready', () => {
  console.log(`[Bot Ready] Logged in as ${client.user?.tag}`);
  client.user?.setActivity('Stellar reputation scores', { type: ActivityType.Watching });
});

// 5. Interaction (Slash Command) Router
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // --- /VERIFY COMMAND ---
  if (commandName === 'verify') {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Generate a temporary link token from backend
      const response = await axios.post(`${backendUrl}/reputation/discord/token`, {
        discord_id: interaction.user.id,
        discord_username: interaction.user.username,
      });

      const { token } = response.data;
      const verifyUrl = `${frontendUrl}/verify-discord?token=${token}`;

      const embed = new EmbedBuilder()
        .setColor('#6366f1')
        .setTitle('🛡️ StellarID Secure Gateway')
        .setDescription(
          `Hello **@${interaction.user.username}**, please link your Stellar Wallet to verify your identity and reputation tier.\n\n` +
          `🔗 **[Click Here to Link Your Wallet](${verifyUrl})**\n\n` +
          `*Note: This link is unique and expires in 10 minutes.*`
        )
        .setFooter({ text: 'StellarID Identity Gating System' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      console.error('Error in /verify command:', err.message);
      await interaction.editReply({
        content: '⚠️ Failed to generate verification link. Please check if the StellarID backend is online.',
      });
    }
  }

  // --- /PROFILE COMMAND ---
  else if (commandName === 'profile') {
    try {
      await interaction.deferReply();
      const targetUser = interaction.options.getUser('user') || interaction.user;

      const response = await axios.get(`${backendUrl}/reputation/discord/user/${targetUser.id}`);
      const data = response.data;

      if (!data.verified) {
        const embed = new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('Profile Not Found')
          .setDescription(
            `❌ **@${targetUser.username}** has not linked their Stellar wallet with StellarID.\n\n` +
            `Run \`/verify\` to generate a secure link and connect your identity.`
          );
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Tier Color mapping
      let color = '#CD7F32'; // Bronze
      if (data.tier === 'Silver') color = '#C0C0C0';
      if (data.tier === 'Gold') color = '#FFD700';
      if (data.tier === 'Platinum') color = '#E5E4E2';

      const formatWallet = (wallet: string) => `${wallet.slice(0, 8)}...${wallet.slice(-8)}`;

      const embed = new EmbedBuilder()
        .setColor(color as any)
        .setTitle(`🛡️ StellarID Profile: @${targetUser.username}`)
        .addFields(
          { name: 'Reputation Score', value: `✨ **${data.total_score}**`, inline: true },
          { name: 'Reputation Tier', value: `🏆 **${data.tier}**`, inline: true },
          { name: 'Stellar Wallet', value: `\`${formatWallet(data.wallet_address)}\``, inline: false },
          {
            name: 'GitHub Developer',
            value: data.github_username ? `✅ Linked (@${data.github_username})` : '❌ Not Linked',
            inline: true,
          },
          {
            name: 'Badges Earned',
            value:
              data.badges && data.badges.length > 0
                ? data.badges.map((b: string) => `🏅 \`${b}\``).join('  ')
                : 'None yet',
            inline: false,
          }
        )
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: 'StellarID Identity Registry' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      console.error('Error in /profile command:', err.message);
      await interaction.editReply({
        content: '⚠️ Failed to fetch profile details. Please try again later.',
      });
    }
  }

  // --- /LEADERBOARD COMMAND ---
  else if (commandName === 'leaderboard') {
    try {
      await interaction.deferReply();

      // Retrieve top 10 users from DB
      const result = await pool.query(
        `SELECT stellar_address, discord_username, reputation_score, reputation_tier 
         FROM users 
         WHERE reputation_score IS NOT NULL 
         ORDER BY reputation_score DESC 
         LIMIT 10`
      );

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🏆 StellarID Global Reputation Leaderboard')
        .setDescription('Top developer and builder reputations in the Stellar ecosystem:')
        .setTimestamp();

      if (result.rows.length === 0) {
        embed.setDescription('No user reputations recorded yet.');
      } else {
        const rows = result.rows.map((row, idx) => {
          const name = row.discord_username ? `@${row.discord_username}` : `${row.stellar_address.slice(0, 6)}...${row.stellar_address.slice(-6)}`;
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `\`#${idx + 1}\``;
          return `${medal} **${name}** — **${row.reputation_score}** (${row.reputation_tier || 'Bronze'})`;
        });
        embed.setDescription(rows.join('\n'));
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err: any) {
      console.error('Error in /leaderboard command:', err.message);
      await interaction.editReply({
        content: '⚠️ Failed to fetch leaderboard. Please try again later.',
      });
    }
  }

  // --- /GATE COMMAND ---
  else if (commandName === 'gate') {
    try {
      await interaction.deferReply({ ephemeral: true });

      const tier = interaction.options.getString('tier', true);
      const channel = interaction.channel;
      const guild = interaction.guild;

      if (!guild || !channel) {
        await interaction.editReply({ content: 'Gating commands can only be run inside a guild channel.' });
        return;
      }

      // Check if user has permission
      const member = await guild.members.fetch(interaction.user.id);
      if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await interaction.editReply({ content: '❌ You must have "Manage Channels" permission to use this command.' });
        return;
      }

      // Write gating configuration to DB
      await pool.query(
        `INSERT INTO discord_gates (guild_id, channel_id, min_tier) 
         VALUES ($1, $2, $3)
         ON CONFLICT (channel_id) 
         DO UPDATE SET min_tier = $3`,
        [guild.id, channel.id, tier]
      );

      // Map roles
      const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      const minTierIndex = tiers.indexOf(tier);
      const allowedTiers = tiers.slice(minTierIndex);

      const permissionOverwrites: any[] = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ];

      for (const t of allowedTiers) {
        const roleName = `Stellar ${t}`;
        let role = guild.roles.cache.find((r) => r.name === roleName);
        if (!role) {
          role = await guild.roles.create({
            name: roleName,
            color: (t === 'Bronze' ? '#CD7F32' : t === 'Silver' ? '#C0C0C0' : t === 'Gold' ? '#FFD700' : '#E5E4E2') as any,
            reason: 'StellarID Gating Role creation',
          });
        }
        permissionOverwrites.push({
          id: role.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      }

      // Apply channel permission updates
      if ('permissionOverwrites' in channel) {
        await (channel as any).permissionOverwrites.set(permissionOverwrites);
      }

      const embed = new EmbedBuilder()
        .setColor('#10b981')
        .setTitle('🔒 Channel Gated')
        .setDescription(
          `This channel has been gated. Only users with a reputation tier of **${tier}** or higher can view it.\n\n` +
          `**Allowed Roles:**\n${allowedTiers.map((t) => `• \`Stellar ${t}\``).join('\n')}`
        );

      await interaction.editReply({ embeds: [embed] });
      
      // Post announcement in channel
      if (channel && 'send' in channel) {
        await (channel as any).send({
          embeds: [
            new EmbedBuilder()
              .setColor('#f59e0b')
              .setTitle('🔒 Rep-Gated Channel Activated')
              .setDescription(
                `This channel is now restricted to **${tier}** tier and above.\n` +
                `Run \`/verify\` to connect your wallet and claim your reputation role.`
              ),
          ],
        });
      }
    } catch (err: any) {
      console.error('Error in /gate command:', err.message);
      await interaction.editReply({
        content: `⚠️ Failed to apply channel gating: ${err.message}`,
      });
    }
  }
});

// Login client
client.login(token);
