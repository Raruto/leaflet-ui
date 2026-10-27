Feature: edit-osm plugin and controls

  Scenario Outline: Edit link opens the current map position
    Given a map using "<bundle>"
    Then the edit link opens the current map position

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
