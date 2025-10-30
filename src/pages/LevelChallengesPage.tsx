import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

export default function LevelChallengesPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Level Challenges
      </Typography>

      {/* Optional: small tab UI within the page for levels */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" />
          <Tab label="Beginner" />
          <Tab label="Intermediate" />
          <Tab label="Advanced" />
        </Tabs>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, border: '1px solid #eee', borderRadius: 2, background: '#fff' }}>
        {/* Replace this with your real list / grid */}
        <Typography sx={{ color: 'text.secondary' }}>
          Choose a tab to filter challenges by level. Hook this up to your data the same way you do on
          the Calendar/All Challenges page.
        </Typography>
      </Paper>
    </Box>
  );
}
