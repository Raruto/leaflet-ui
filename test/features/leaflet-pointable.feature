Feature: pointable plugin and controls

  Scenario Outline: Pointable is loaded as a custom plugin and reads real canvas pixels
    Given a map using "<bundle>" with options:
      """
      {"plugins":["/node_modules/leaflet-pointable/leaflet-pointable.js"],"gestureHandling":false,"rotate":false,"minimapControl":false}
      """
    When I add a pointable canvas overlay
    Then opaque pixels are clickable and transparent pixels are not
    And removing the overlay unregisters it
    And custom plugin scripts are shared between maps

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
