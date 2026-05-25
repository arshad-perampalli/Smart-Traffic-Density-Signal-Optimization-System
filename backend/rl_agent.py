import json
import os
import random

Q_TABLE_PATH = os.path.join(os.path.dirname(__file__), "q_table.json")

ALPHA = 0.1
GAMMA = 0.9
EPSILON = 0.1
NUM_LANES = 4
SECS_PER_VEHICLE = 0.7   # each vehicle adds 0.7s of green time
MIN_GREEN = 5
MAX_GREEN = 60


def _load_q_table():
    if os.path.exists(Q_TABLE_PATH):
        with open(Q_TABLE_PATH, "r") as f:
            raw = json.load(f)
        return {eval(k): {int(a): v for a, v in actions.items()} for k, actions in raw.items()}
    return {}


def _save_q_table(q_table):
    serializable = {str(k): {str(a): v for a, v in actions.items()} for k, actions in q_table.items()}
    with open(Q_TABLE_PATH, "w") as f:
        json.dump(serializable, f)


def discretize(count):
    if count < 5:
        return 0
    elif count < 15:
        return 1
    return 2


def get_state(lane_counts: dict) -> tuple:
    return tuple(discretize(lane_counts.get(i, 0)) for i in range(1, NUM_LANES + 1))


def choose_action(state: tuple, q_table: dict) -> int:
    if random.random() < EPSILON or state not in q_table:
        return random.randint(0, NUM_LANES - 1)
    return max(q_table[state], key=q_table[state].get)


def compute_reward(action: int, lane_counts: dict) -> float:
    chosen_lane = action + 1
    waiting_penalty = sum(lane_counts.get(i, 0) for i in range(1, NUM_LANES + 1) if i != chosen_lane)
    relief = lane_counts.get(chosen_lane, 0)
    return float(relief - waiting_penalty * 0.5)


def update_q_table(q_table: dict, state: tuple, action: int, reward: float, next_state: tuple):
    if state not in q_table:
        q_table[state] = {}
    if action not in q_table[state]:
        q_table[state][action] = 0.0
    next_max = max(q_table[next_state].values()) if next_state in q_table and q_table[next_state] else 0.0
    q_table[state][action] += ALPHA * (reward + GAMMA * next_max - q_table[state][action])
    return q_table


class TrafficRLAgent:
    def __init__(self):
        self.q_table = _load_q_table()
        self.prev_state = None
        self.prev_action = None
        self.total_reward = 0.0
        self.episode_count = 0

    def step(self, lane_counts: dict) -> dict:
        state = get_state(lane_counts)

        if self.prev_state is not None:
            reward = compute_reward(self.prev_action, lane_counts)
            self.total_reward += reward
            self.episode_count += 1
            self.q_table = update_q_table(self.q_table, self.prev_state, self.prev_action, reward, state)
            if self.episode_count % 50 == 0:
                _save_q_table(self.q_table)

        action = choose_action(state, self.q_table)
        self.prev_state = state
        self.prev_action = action

        green_lane = action + 1
        green_time = max(MIN_GREEN, min(MAX_GREEN, lane_counts.get(green_lane, 0) * SECS_PER_VEHICLE))

        return {
            "green_lane": green_lane,
            "green_time": green_time,
            "state": list(state),
            "action": action,
            "q_states_learned": len(self.q_table),
        }

    def get_stats(self) -> dict:
        avg_reward = self.total_reward / max(1, self.episode_count)
        return {
            "total_reward": round(self.total_reward, 2),
            "episode_count": self.episode_count,
            "avg_reward_per_episode": round(avg_reward, 2),
            "last_waiting_time": round(abs(min(0, avg_reward)), 2),
            "q_states_learned": len(self.q_table),
            "epsilon": EPSILON,
        }
