Feature: search plugin and controls

  Scenario Outline: Search moves the map to the result
    Given a map using "<bundle>"
    When I search for a place
    Then the map moves to the search result

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Empty search leaves the map usable
    Given a map using "<bundle>"
    Then an empty search displays no results without moving the map

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
