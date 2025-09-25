(function () {
  function embedCharts() {
    const specs = [
      {
        element: '#choropleth_map_spec',
        spec: 'js/malaysia_choropleth_map.json',
        options: {
          actions: {
            export: true,
            source: true,
            compiled: false,
            editor: true
          }
        }
      },
      {
        element: '#radial_tree_spec',
        spec: 'js/radial_tree.js',
        options: {
          actions: {
            export: true,
            source: true,
            compiled: false,
            editor: true
          }
        }
      },
      {
        element: '#brushing_interaction_3charts_spec',
        spec: 'js/brushing_interaction_3charts.json'
      },
      {
        element: '#bump_chart',
        spec: 'js/bump_chart.json'
      }
    ];

    const embeds = specs.map(({ element, spec, options }) =>
      vegaEmbed(element, spec, options).catch((error) =>
        console.error(`Failed to embed ${spec}:`, error)
      )
    );

    Promise.all(embeds).catch((error) => console.error(error));
  }

  function initSunburst() {
    if (typeof createSunburstChart === 'function') {
      createSunburstChart('data/zoomable_gdp_data.csv', '#sunburst_chart');
    } else {
      console.error('createSunburstChart is not available.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      embedCharts();
      initSunburst();
    });
  } else {
    embedCharts();
    initSunburst();
  }
})();
