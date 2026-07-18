# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Remove default nginx welcome page and install placeholder
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html
COPY index.html /usr/share/nginx/html/index.html

# Minimal nginx config: serve on port 8080 (non-root friendly) with SPA-style fallback
RUN printf 'server {\n\
    listen 8080;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
