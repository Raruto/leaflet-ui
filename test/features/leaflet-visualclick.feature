Feature: visualclick plugin and controls

  Scenario Outline: Map clicks show temporary feedback, control clicks do not
    Given a map using "<bundle>" with options:
      """
      {"visualClick":{"removeTimeout":1000},"gestureHandling":false}
      """
    Then map clicks and context clicks show feedback that disappears
    And control clicks and disabled visual feedback create no marker

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
