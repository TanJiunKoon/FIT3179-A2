{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "Radial Tree Layout of Economic Sectors",
  "width": 1080,
  "height": 950,
  "padding": 5,
  "autosize": "none",

  "signals": [
    { "name": "labels", "value": true, "bind": {"input": "checkbox"} },
    { "name": "radius", "value": 275, "bind": {"input": "range", "min": 20, "max": 600} },
    { "name": "extent", "value": 360, "bind": {"input": "range", "min": 0, "max": 360, "step": 1} },
    { "name": "rotate", "value": 0, "bind": {"input": "range", "min": 0, "max": 360, "step": 1} },
    { "name": "layout", "value": "cluster", "bind": {"input": "radio", "options": ["cluster", "tidy"]} },
    {
      "name": "links", "value": "line",
      "bind": { "input": "select", "options": ["line", "curve", "diagonal", "orthogonal"] }
    },
    { "name": "originX", "update": "width / 2" },
    { "name": "originY", "update": "height / 2" }
  ],

  "data": [
    {
      "name": "tree",
      "url": "https://raw.githubusercontent.com/TanJiunKoon/FIT3179-A2/main/data/data.json",
      "transform": [
        { "type": "stratify", "key": "id", "parentKey": "parent" },
        {
          "type": "tree",
          "method": {"signal": "layout"},
          "size": [1, {"signal": "radius"}],
          "as": ["alpha", "radius", "depth", "children"]
        },
        { "type": "formula", "expr": "(rotate + extent * datum.alpha + 270) % 360", "as": "angle" },
        { "type": "formula", "expr": "PI * datum.angle / 180", "as": "radians" },
        { "type": "formula", "expr": "inrange(datum.angle, [90, 270])", "as": "leftside" },
        { "type": "formula", "expr": "originX + datum.radius * cos(datum.radians)", "as": "x" },
        { "type": "formula", "expr": "originY + datum.radius * sin(datum.radians)", "as": "y" }
      ]
    },
    {
      "name": "links",
      "source": "tree",
      "transform": [
        { "type": "treelinks" },
        {
          "type": "linkpath",
          "shape": {"signal": "links"}, "orient": "radial",
          "sourceX": "source.radians", "sourceY": "source.radius",
          "targetX": "target.radians", "targetY": "target.radius"
        }
      ]
    }
  ],

  "scales": [
    {
      "name": "color",
      "type": "linear",
      "range": {"scheme": "magma"},
      "domain": {"data": "tree", "field": "depth"},
      "zero": true
    }
  ],

  "marks": [
    {
      "type": "path",
      "from": {"data": "links"},
      "encode": {
        "update": {
          "x": {"signal": "originX"},
          "y": {"signal": "originY"},
          "path": {"field": "path"},
          "stroke": {"value": "#ccc"}
        }
      }
    },
    {
      "type": "symbol",
      "from": {"data": "tree"},
      "encode": {
        "enter": { "size": {"value": 100}, "stroke": {"value": "#fff"} },
        "update": {
          "x": {"field": "x"},
          "y": {"field": "y"},
          "fill": {"scale": "color", "field": "depth"}
        }
      }
    },
    {
      "type": "text",
      "from": {"data": "tree"},
      "encode": {
        "enter": {
          "text": {"field": "name"},
          "fontSize": {"value": 11},
          "baseline": {"value": "middle"}
        },
        "update": {
          "x": {"field": "x"},
          "y": {"field": "y"},
          "dx": {"signal": "(datum.leftside ? -1 : 1) * 6"},
          "angle": {"signal": "datum.leftside ? datum.angle - 180 : datum.angle"},
          "align": {"signal": "datum.leftside ? 'right' : 'left'"},
          "opacity": {"signal": "labels ? 1 : 0"}
        }
      }
    }
  ]
}
