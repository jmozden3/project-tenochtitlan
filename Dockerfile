FROM node:22-slim

# Claude Code is the nightly engine. If the package name ever changes, the
# build will fail here with a clear error — update the line below if so.
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /work

# The repo is mounted at /work and the host's Claude credentials at
# /root/.claude at runtime (see nightly.sh). Nothing is baked into the image.
