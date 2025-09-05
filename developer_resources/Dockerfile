FROM 537124944113.dkr.ecr.eu-west-2.amazonaws.com/ndtp/secure-agent-graph:0.91.0-experimental
USER root:root

COPY --chown=root:root --chmod=755 ./config/config.ttl /fuseki/config
COPY --chown=root:root --chmod=755 ./config/attribute-store.ttl /fuseki/config
COPY --chown=root:root --chmod=755 ./kafka/consumer.properties /fuseki/kafka/consumer.properties
