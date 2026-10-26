@browser
Feature: Leaflet UI controls
  Scenario Outline: Controls work with each browser bundle
    Given a map using "<bundle>"
    Then the UI controls use the page's Leaflet
    When I enter and exit fullscreen
    Then the map has left fullscreen
    When I rotate the map, open search and locate a position
    Then rotation, search and location are updated
    And empty translations remain empty

    Examples:
      | bundle            |
      | leaflet-ui-src.js |
      | leaflet-ui.js     |
