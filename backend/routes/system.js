const express = require('express');
const router = express.Router();
const { execSync } = require('child_process');

/**
 * Get system version information from git
 */
router.get('/version', (req, res) => {
  try {
    // Get latest git tag (version)
    let version = 'unknown';
    try {
      version = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "v1.0.0"', { 
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }).trim();
    } catch (e) {
      version = 'v1.0.0';
    }

    // Get current commit hash
    let commitHash = 'unknown';
    try {
      commitHash = execSync('git rev-parse --short HEAD', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }).trim();
    } catch (e) {
      commitHash = 'unknown';
    }

    // Get current branch
    let branch = 'unknown';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }).trim();
    } catch (e) {
      branch = 'unknown';
    }

    // Get last commit date
    let lastUpdate = 'unknown';
    try {
      lastUpdate = execSync('git log -1 --format=%cd --date=format:"%Y-%m-%d %H:%M:%S"', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }).trim();
    } catch (e) {
      lastUpdate = new Date().toISOString();
    }

    // Get last commit message
    let lastCommit = 'No commits';
    try {
      lastCommit = execSync('git log -1 --format=%s', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }).trim();
    } catch (e) {
      lastCommit = 'No commits';
    }

    // Check if there are uncommitted changes
    let hasChanges = false;
    try {
      const status = execSync('git status --porcelain', {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }).trim();
      hasChanges = status.length > 0;
    } catch (e) {
      hasChanges = false;
    }

    res.json({
      success: true,
      version,
      commit: {
        hash: commitHash,
        message: lastCommit,
        date: lastUpdate,
        branch
      },
      hasUncommittedChanges: hasChanges,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      nodeVersion: process.version
    });
  } catch (error) {
    console.error('[System] Error getting version:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting system version',
      version: 'unknown'
    });
  }
});

/**
 * Get release history with changelogs
 */
router.get('/releases', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Get all tags with their dates and messages
    let releasesRaw = '';
    try {
      releasesRaw = execSync(
        `git tag -l --sort=-version:refname --format='%(refname:short)|%(creatordate:format:%Y-%m-%d %H:%M:%S)|%(subject)' | head -n ${limit}`,
        {
          encoding: 'utf-8',
          cwd: __dirname + '/..'
        }
      ).trim();
    } catch (e) {
      return res.json({
        success: true,
        releases: [],
        message: 'No releases found'
      });
    }

    if (!releasesRaw) {
      return res.json({
        success: true,
        releases: [],
        message: 'No releases found'
      });
    }

    const releases = releasesRaw.split('\n').map(line => {
      const [tag, date, subject] = line.split('|');
      
      // Get detailed changelog for this tag
      let changelog = '';
      try {
        // Get commit message body for the tag
        const tagMessage = execSync(
          `git tag -l --format='%(contents)' ${tag}`,
          {
            encoding: 'utf-8',
            cwd: __dirname + '/..'
          }
        ).trim();
        
        changelog = tagMessage || subject || 'No changelog available';
      } catch (e) {
        changelog = subject || 'No changelog available';
      }

      // Get commits since last tag
      let commitsSinceLastTag = [];
      try {
        const prevTag = execSync(
          `git describe --tags --abbrev=0 ${tag}~1 2>/dev/null || echo ""`,
          {
            encoding: 'utf-8',
            cwd: __dirname + '/..'
          }
        ).trim();

        if (prevTag) {
          const commits = execSync(
            `git log ${prevTag}..${tag} --format='%h|%s|%an|%cd' --date=format:'%Y-%m-%d' | head -n 20`,
            {
              encoding: 'utf-8',
              cwd: __dirname + '/..'
            }
          ).trim();

          if (commits) {
            commitsSinceLastTag = commits.split('\n').map(commit => {
              const [hash, message, author, commitDate] = commit.split('|');
              return { hash, message, author, date: commitDate };
            });
          }
        }
      } catch (e) {
        // Ignore if can't get commits
      }

      return {
        tag,
        date,
        changelog,
        commits: commitsSinceLastTag
      };
    });

    res.json({
      success: true,
      releases,
      total: releases.length
    });
  } catch (error) {
    console.error('[System] Error getting releases:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting release history',
      releases: []
    });
  }
});

/**
 * Get detailed info about a specific release
 */
router.get('/releases/:tag', (req, res) => {
  try {
    const { tag } = req.params;

    // Validate tag exists
    try {
      execSync(`git rev-parse ${tag}`, {
        cwd: __dirname + '/..',
        stdio: 'ignore'
      });
    } catch (e) {
      return res.status(404).json({
        success: false,
        error: 'Release not found'
      });
    }

    // Get tag date
    const tagDate = execSync(
      `git tag -l --format='%(creatordate:format:%Y-%m-%d %H:%M:%S)' ${tag}`,
      {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }
    ).trim();

    // Get tag message (changelog)
    const tagMessage = execSync(
      `git tag -l --format='%(contents)' ${tag}`,
      {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }
    ).trim();

    // Get tagger
    const tagger = execSync(
      `git tag -l --format='%(taggername)' ${tag}`,
      {
        encoding: 'utf-8',
        cwd: __dirname + '/..'
      }
    ).trim();

    // Get commits for this tag
    let commits = [];
    try {
      const prevTag = execSync(
        `git describe --tags --abbrev=0 ${tag}~1 2>/dev/null || echo ""`,
        {
          encoding: 'utf-8',
          cwd: __dirname + '/..'
        }
      ).trim();

      const range = prevTag ? `${prevTag}..${tag}` : tag;
      const commitsRaw = execSync(
        `git log ${range} --format='%H|%h|%s|%an|%ae|%cd|%b' --date=format:'%Y-%m-%d %H:%M:%S'`,
        {
          encoding: 'utf-8',
          cwd: __dirname + '/..'
        }
      ).trim();

      if (commitsRaw) {
        commits = commitsRaw.split('\n\n').map(commit => {
          const [fullHash, hash, subject, author, email, date, body] = commit.split('|');
          return {
            fullHash,
            hash,
            subject,
            author,
            email,
            date,
            body: body || ''
          };
        });
      }
    } catch (e) {
      // Ignore
    }

    res.json({
      success: true,
      release: {
        tag,
        date: tagDate,
        tagger: tagger || 'Unknown',
        changelog: tagMessage || 'No changelog available',
        commits
      }
    });
  } catch (error) {
    console.error('[System] Error getting release details:', error);
    res.status(500).json({
      success: false,
      error: 'Error getting release details'
    });
  }
});

/**
 * Get system health/status
 */
router.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    status: 'healthy',
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime)
    },
    memory: {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
    },
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development'
  });
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

module.exports = router;
