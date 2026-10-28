Feature: rotate plugin and controls

  Scenario Outline: Rotation controls change the bearing and keep coordinates consistent
    Given a map using "<bundle>" with options:
      """
      {"rotateControl":{"closeOnZeroBearing":false},"gestureHandling":false}
      """
    When I drag the rotation control left by 45 pixels
    Then the bearing is 324 degrees and the rotation arrow is updated
    And rotated map coordinates round-trip correctly

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
