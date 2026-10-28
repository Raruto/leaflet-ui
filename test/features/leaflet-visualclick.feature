Feature: visualclick plugin and controls

  Scenario Outline: Map clicks show temporary feedback, control clicks do not
    # Keep right-click feedback independent of the rotation plugin's right-button drag.
    Given a map using "<bundle>" with options:
      """
      {"visualClick":{"removeTimeout":1000},"gestureHandling":false,"pitchDrag":false}
      """
    Then map clicks and context clicks show feedback that disappears
    And control clicks and disabled visual feedback create no marker

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
