#!/usr/bin/env bash

echo "Starting RabbitMQ service..."
sudo systemctl start rabbitmq-server

echo "Enabling management plugin..."
sudo rabbitmq-plugins enable rabbitmq_management || true

echo "Creating vhost, user, and permissions..."
sudo rabbitmqctl add_vhost /app || true
sudo rabbitmqctl add_user svc svcpass || true
sudo rabbitmqctl set_permissions -p /app svc ".*" ".*" ".*" || true

# rabbitmqadmin is part of the management plugin (CLI tool).
if ! command -v rabbitmqadmin >/dev/null 2>&1; then
  echo "Downloading rabbitmqadmin CLI..."
  curl -s -o rabbitmqadmin http://localhost:15672/cli/rabbitmqadmin
  chmod +x rabbitmqadmin
  sudo mv rabbitmqadmin /usr/local/bin/
fi

echo "Declaring exchange, queues, and bindings..."
rabbitmqadmin -u svc -p svcpass -V /app declare exchange name=mood.direct type=direct durable=true || true

rabbitmqadmin -u svc -p svcpass -V /app declare queue name=user_request_q durable=true || true
rabbitmqadmin -u svc -p svcpass -V /app declare queue name=mood_analysis_q durable=true || true
rabbitmqadmin -u svc -p svcpass -V /app declare queue name=recommendation_q durable=true || true

rabbitmqadmin -u svc -p svcpass -V /app declare binding source=mood.direct destination_type=queue destination=user_request_q routing_key=frontend.request || true
rabbitmqadmin -u svc -p svcpass -V /app declare binding source=mood.direct destination_type=queue destination=mood_analysis_q routing_key=analysis.result || true
rabbitmqadmin -u svc -p svcpass -V /app declare binding source=mood.direct destination_type=queue destination=recommendation_q routing_key=recommendation.output || true
