ARG OPENHAB_VERSION=5.2.0
FROM openhab/openhab:${OPENHAB_VERSION}

ARG OPENHAB_VERSION=5.2.0

# Replace the Main UI bundle in the Karaf system repository with the bundle
# built from this branch. Keeping the same version avoids installing a second
# org.openhab.ui bundle and lets openHAB start normally from the patched jar.
COPY bundles/org.openhab.ui/target/org.openhab.ui-${OPENHAB_VERSION}.jar \
  /openhab/runtime/system/org/openhab/ui/bundles/org.openhab.ui/${OPENHAB_VERSION}/org.openhab.ui-${OPENHAB_VERSION}.jar
