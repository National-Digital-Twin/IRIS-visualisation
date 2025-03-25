# jMeter IRIS performance testing

The jmx file in this directory contains the steps necessary to subject the IRIS web visualiser application using [jMeter](https://jmeter.apache.org/).

## jMeter required variables

When running tests, to navigate authentication (inclusive of Multi-factor authentication), you must first sign into the NDT landing page. On signing in, you will be issued a cookie named "oidc-cookie", which you can inspect using your web browser's development tools. To allow jMeter to act as an authenticated party, you need to provide the value of this cookie using a jMeter User Defined Variable. The value of the "oidc-cookie" should be set in the jMeter variable named OIDC_COOKIE_VALUE. If you are testing in environments other than development, you can also change the OIDC_COOKIE_DOMAIN and BASE_URL (the base IRIS visualiser URL) variables as required. The OIDC cookie will remain valid for at least 1 hour, which will allow tests to be run. You will need to refresh the OIDC cookie value if you exceed this timebox.