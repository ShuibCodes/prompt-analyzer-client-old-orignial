import { Box, Paper, Typography } from '@mui/material';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { CriterionResult } from '../types';

interface ResultChartsProps {
  criterionResults: Array<CriterionResult & { name?: string }>;
  taskScores?: number[];
}

const ResultCharts: React.FC<ResultChartsProps> = ({ criterionResults, taskScores }) => {
  // Prepare data for bar chart
  const barData = criterionResults.map(criterion => ({
    criterion: criterion.name || criterion.criterionId,
    score: criterion.score,
    color: criterion.score >= 4 ? '#4caf50' : criterion.score >= 2.5 ? '#ff9800' : '#f44336'
  }));

  // Prepare data for pie chart
  const pieData = criterionResults.map(criterion => ({
    id: criterion.name || criterion.criterionId,
    label: criterion.name || criterion.criterionId,
    value: criterion.score,
    color: criterion.score >= 4 ? '#4caf50' : criterion.score >= 2.5 ? '#ff9800' : '#f44336'
  }));

  // Prepare data for line chart (if we have task scores)
  const lineData = taskScores ? [{
    id: 'Score Progress',
    data: taskScores.map((score, index) => ({
      x: `Attempt ${index + 1}`,
      y: score
    }))
  }] : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 4 }}>
      {/* Bar Chart */}
      <Paper elevation={2} sx={{ p: 2, height: 400 }}>
        <Typography variant="h6" gutterBottom>Criteria Performance</Typography>
        <ResponsiveBar
          data={barData}
          keys={['score']}
          indexBy="criterion"
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear', min: 0, max: 5 }}
          colors={({ data }) => data.color}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Criteria',
            legendPosition: 'middle',
            legendOffset: 60
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Score',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor="#ffffff"
        />
      </Paper>

      {/* Pie Chart */}
      <Paper elevation={2} sx={{ p: 2, height: 400 }}>
        <Typography variant="h6" gutterBottom>Score Distribution</Typography>
        <ResponsivePie
          data={pieData}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          colors={({ data }) => data.color}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          enableArcLinkLabels={true}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLabelsSkipAngle={10}
          arcLabelsTextColor="#ffffff"
        />
      </Paper>

      {/* Line Chart (only shown if we have task scores) */}
      {taskScores && taskScores.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>Score Progress</Typography>
          <ResponsiveLine
            data={lineData}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 0, max: 100, stacked: false }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Attempts',
              legendOffset: 36,
              legendPosition: 'middle'
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Score',
              legendOffset: -40,
              legendPosition: 'middle'
            }}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ResultCharts; 