# ---- build stage ----
FROM golang:1.23-alpine AS build
WORKDIR /src
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Pure-Go mysql driver -> static binary. Migrations are embedded (no copy step).
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/trexo ./cmd/server

# ---- runtime stage ----
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata && adduser -D -u 10001 trexo
COPY --from=build /out/trexo /usr/local/bin/trexo
USER trexo
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/trexo"]
