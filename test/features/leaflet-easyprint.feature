Feature: easyprint plugin and controls

  Scenario Outline: Exported maps are real PNG images and restore the UI
    Given a map using "<bundle>" with options:
      """
      {"mapTypeIds":[],"minimapControl":false,"printControl":{"sizeModes":["Current","A4Landscape","A4Portrait"]}}
      """
    When I export the map in "<size>" format
    Then a PNG of <width> by <height> pixels is downloaded
    And printing restores the map size, position and controls

    Examples:
      | bundle            | size        | width | height |
      | leaflet-ui-src.js | CurrentSize | 600   | 400    |
      | leaflet-ui-src.js | A4Landscape | 1045  | 715    |
      | leaflet-ui-src.js | A4Portrait  | 715   | 1045   |
      | leaflet-ui.js     | CurrentSize | 600   | 400    |
      | leaflet-ui.js     | A4Landscape | 1045  | 715    |
      | leaflet-ui.js     | A4Portrait  | 715   | 1045   |
