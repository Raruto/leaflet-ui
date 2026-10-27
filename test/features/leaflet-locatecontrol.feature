Feature: locate plugin and controls

  Scenario Outline: Browser geolocation can be started and stopped from the control
    Given a map using "<bundle>"
    Then the locate button displays the browser position and stops on a second click

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |

  Scenario Outline: Geolocation denial stops locating
    Given a map using "<bundle>"
    Then a geolocation denial is reported and locating stops

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
