FROM ghcr.io/national-digital-twin/secure-agent-graph:0.90.0
USER root:root

COPY --chown=root:root --chmod=755 ./config/config.ttl /fuseki/config
COPY --chown=root:root --chmod=755 ./config/attribute-store.ttl /fuseki/config
COPY --chown=root:root --chmod=755 ./kafka/consumer.properties /fuseki/kafka/consumer.properties
