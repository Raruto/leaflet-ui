Feature: pegman plugin and controls

  Scenario Outline: Pegman uses the real GoogleMutant layer with a simulated Google service
    Given a simulated Google Maps service
    And a map using "<bundle>" with options:
      """
      {"pegmanControl":true,"gestureHandling":false}
      """
    When I activate Street View coverage
    Then GoogleMutant synchronizes with the Leaflet map
    And GoogleMutant renders tiles received from the simulated service
    When I select a Street View location
    Then the panorama and Pegman marker show the selected location
    And closing Street View removes coverage and the marker
    And dragging Pegman onto the map opens a panorama
    And a location without Street View reports a warning

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
