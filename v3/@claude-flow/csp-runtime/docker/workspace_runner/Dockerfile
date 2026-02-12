FROM python:3.12-slim

WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash curl ca-certificates build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY workspace_runner/requirements-docker.txt /tmp/requirements-docker.txt
RUN pip install --no-cache-dir -r /tmp/requirements-docker.txt

COPY workspace_runner/entrypoint.sh /usr/local/bin/csp-workspace-entrypoint.sh
RUN chmod +x /usr/local/bin/csp-workspace-entrypoint.sh

RUN mkdir -p /workspace /artifacts

ENTRYPOINT ["/usr/local/bin/csp-workspace-entrypoint.sh"]
CMD ["python", "--version"]
