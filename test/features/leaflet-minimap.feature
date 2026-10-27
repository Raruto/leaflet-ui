Feature: minimap plugin and controls

  Scenario Outline: Base layers and minimap stay synchronized
    Given a map using "<bundle>"
    When I switch base layers and click the minimap
    Then the base layer, minimap and attribution stay synchronized

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
