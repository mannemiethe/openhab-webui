ARG OPENHAB_VERSION=5.1.4
FROM openhab/openhab:${OPENHAB_VERSION}

ARG OPENHAB_VERSION=5.1.4

# Replace the Main UI bundle in the Karaf system repository with the bundle
# built from this branch. Keeping the same version avoids installing a second
# org.openhab.ui bundle and keeps the image otherwise identical to upstream.
COPY bundles/org.openhab.ui/target/org.openhab.ui-${OPENHAB_VERSION}.jar \
  /openhab/runtime/system/org/openhab/ui/bundles/org.openhab.ui/${OPENHAB_VERSION}/org.openhab.ui-${OPENHAB_VERSION}.jar
