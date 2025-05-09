import numpy as np
import random
from collections import defaultdict
import json

class QLearningAgent:
    def __init__(self, alpha=0.1, gamma=0.99, epsilon=1.0, epsilon_decay=0.995, epsilon_min=0.01, action_space_size=9):
        self.q_table = defaultdict(lambda: np.zeros(action_space_size)) # Qテーブル: {state_tuple: [q_val_action0, q_val_action1,...]}
        self.alpha = alpha          # 学習率
        self.gamma = gamma          # 割引率
        self.epsilon = epsilon      # ε-greedy法のε初期値
        self.epsilon_decay = epsilon_decay # εの減衰率
        self.epsilon_min = epsilon_min    # εの最小値
        self.action_space_size = action_space_size

    def coords_to_action_idx(self, coords):
        """ (row, col) 座標を 0-8 のアクションインデックスに変換 """
        return coords[0] * 3 + coords[1]

    def action_idx_to_coords(self, idx):
        """ 0-8 のアクションインデックスを (row, col) 座標に変換 """
        return (idx // 3, idx % 3)

    def choose_action(self, state_tuple, available_actions_coords):
        """ ε-greedy法に基づいて行動を選択 """
        if not available_actions_coords: # 打てる手がない場合
            return None

        available_action_indices = [self.coords_to_action_idx(ac) for ac in available_actions_coords]

        if random.random() < self.epsilon:
            # 探索 (ランダムに行動を選択)
            action_idx = random.choice(available_action_indices)
        else:
            # 活用 (Q値が最大となる行動を選択)
            q_values_for_state = self.q_table[state_tuple]
            # 利用可能なアクションのQ値のみを考慮
            available_q_values = {idx: q_values_for_state[idx] for idx in available_action_indices}
            if not available_q_values: # 念のため (通常は発生しないはず)
                 action_idx = random.choice(available_action_indices)
            else:
                # Q値が最大の行動が複数ある場合はランダムに一つ選ぶ
                max_q = max(available_q_values.values())
                best_actions = [idx for idx, q_val in available_q_values.items() if q_val == max_q]
                action_idx = random.choice(best_actions)
        
        return self.action_idx_to_coords(action_idx)

    def learn(self, state_tuple, action_coords, reward, next_state_tuple, next_available_actions_coords, done):
        """ Q値を更新 """
        action_idx = self.coords_to_action_idx(action_coords)
        current_q = self.q_table[state_tuple][action_idx]

        if done:
            target_q = reward  # ゲーム終了時は報酬そのものが目標Q値
        else:
            next_q_values_for_next_state = self.q_table[next_state_tuple]
            
            if not next_available_actions_coords: # 次の状態で打てる手がない (引き分けなどで発生しうる)
                max_next_q = 0
            else:
                next_available_action_indices = [self.coords_to_action_idx(ac) for ac in next_available_actions_coords]
                valid_next_q_values = [next_q_values_for_next_state[idx] for idx in next_available_action_indices]
                if not valid_next_q_values: # さらに念のため
                    max_next_q = 0
                else:
                    max_next_q = np.max(valid_next_q_values)
            
            # 相手の手番の価値は自分にとっては負の価値になる (二人零和ゲームの考え方)
            # reward はこの手番での即時報酬 (マルバツでは通常0、ゲーム終了時のみ値を持つ)
            target_q = reward + self.gamma * (-max_next_q) 
                                            # ^^^^^^^^^^^^ 重要: 次の状態は相手の手番なので、
                                            # 相手がQ値を最大化する行動を取ると仮定し、その価値の符号を反転させる

        # Q値の更新
        self.q_table[state_tuple][action_idx] = current_q + self.alpha * (target_q - current_q)

    def decay_epsilon(self):
        """ ε値を減衰させる """
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def save_q_table(self, filename="q_table.json"):
        """ QテーブルをJSONファイルとして保存 """
        # defaultdictは直接JSONにできないので、通常のdictに変換
        # state_tuple (タプルキー) も文字列に変換
        q_table_serializable = {str(k): list(v) for k, v in self.q_table.items()}
        with open(filename, 'w') as f:
            json.dump(q_table_serializable, f)
        print(f"Q-table saved to {filename}")

    def load_q_table(self, filename="q_table.json"):
        """ QテーブルをJSONファイルから読み込む """
        try:
            with open(filename, 'r') as f:
                q_table_loaded = json.load(f)
            
            self.q_table = defaultdict(lambda: np.zeros(self.action_space_size))
            for k_str, v_list in q_table_loaded.items():
                # 文字列キーをタプルキーに戻す (evalは慎重に使うべきだが、ここでは構成要素が整数なので比較的安全)
                # より安全な方法は、キーの保存形式を工夫すること (例: "1,0,-1,0,...")
                state_tuple = tuple(map(int, k_str.strip('()').split(',')))
                self.q_table[state_tuple] = np.array(v_list)
            print(f"Q-table loaded from {filename}")
        except FileNotFoundError:
            print(f"File {filename} not found. Starting with an empty Q-table.")
        except Exception as e:
            print(f"Error loading Q-table: {e}. Starting with an empty Q-table.")