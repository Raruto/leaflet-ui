Feature: resizer plugin and controls

  Scenario Outline: Resize handles update the container and Leaflet size
    Given a map using "<bundle>" with options:
      """
      {"resizerControl":{"direction":"<direction>"},"gestureHandling":false}
      """
    When I drag the resize handle by 60 pixels horizontally and 40 vertically
    Then the map grows by <dx> pixels horizontally and <dy> vertically
    And disabling the resizer prevents further resizing

    Examples:
      | bundle            | direction | dx | dy |
      | leaflet-ui-src.js | e         | 60 | 0  |
      | leaflet-ui-src.js | s         | 0  | 40 |
      | leaflet-ui-src.js | se        | 60 | 40 |
      | leaflet-ui.js     | e         | 60 | 0  |
      | leaflet-ui.js     | s         | 0  | 40 |
      | leaflet-ui.js     | se        | 60 | 40 |
