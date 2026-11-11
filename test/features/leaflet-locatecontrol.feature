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

  Scenario Outline: Locate marker subclasses initialize independently
    Given a map using "<bundle>"
    Then the location and compass markers retain their own coordinates and styles

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
