# Cart API Load Test

## Requirements

- Bash
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)

## Setup

Create `.env` beside `run.sh`:

```dotenv
BASE_URL=https://api.practicesoftwaretesting.com
```

Use an environment authorized for load testing.

## Run

From the `loadtest` directory:

```bash
bash run.sh --rehearsal
```

Validates setup and response checks with one GET Cart request.

```bash
bash run.sh --loadtest
```

Runs a six-minute load profile, increasing from 5 to 20 requests per second before returning to 5.

A profile argument is required. Results appear in the terminal and are saved to `results/` as timestamped JSON metric files.