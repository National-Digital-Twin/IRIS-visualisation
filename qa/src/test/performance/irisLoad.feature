Feature: IRIS Landing Page

@performance
 Scenario: Measure performance of the landing page
    When I run Lighthouse analysis for IRIS "dashboard" page
    Then the performance score should be at least 95