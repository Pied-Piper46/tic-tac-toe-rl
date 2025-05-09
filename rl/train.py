import os
import numpy as np
from tictactoe_env import TicTacToeEnv
from q_learning_agent import QLearningAgent

def train(num_episodes=10000, alpha=0.1, gamma=0.99, epsilon_start=1.0, epsilon_decay=0.9995, epsilon_min=0.01, q_table_filename="q_table.json"):
    env = TicTacToeEnv()
    # プレイヤー1 (O) とプレイヤー2 (X) で同じQテーブルを共有するエージェント
    # マルバツは対称的なゲームなので、1つのQテーブルで両プレイヤーの戦略を学習できる
    agent = QLearningAgent(alpha=alpha, gamma=gamma, epsilon=epsilon_start, epsilon_decay=epsilon_decay, epsilon_min=epsilon_min)
    
    # 既存のQテーブルがあれば読み込む (学習を再開する場合など)
    # agent.load_q_table(q_table_filename) 

    wins_p1 = 0
    wins_p2 = 0
    draws = 0

    for episode in range(num_episodes):
        state_tuple = env.reset()
        done = False
        
        # エピソード中の履歴 (s, a, r, s', available_next_actions, done_flag_for_learn)
        # この情報を元にエピソード終了後に学習することもできるが、今回は各ステップで学習する
        history_for_learning = [] 

        while not done:
            current_player_perspective = env.current_player # 1 or -1
            
            available_actions_coords = env.get_available_actions()
            if not available_actions_coords: # 通常は発生しない (引き分け判定が先のはず)
                print("Error: No available actions but game not done.")
                break 

            # エージェントに行動を選択させる (現在の盤面は全プレイヤー共通)
            action_coords = agent.choose_action(state_tuple, available_actions_coords)
            if action_coords is None: # 選択できる行動がない (エラーケース)
                print("Error: Agent could not choose an action.")
                break

            # 学習ループをシンプルにするため、エピソードの最後にまとめて学習する方式を採用する
            # s, a, player を記録
            history_for_learning.append({
                'state': state_tuple,
                'action_coords': action_coords,
                'player_who_acted': current_player_perspective
            })

            # 行動を実行
            next_state_tuple, immediate_reward_for_actor, done, _ = env.step(action_coords)
            # env.stepのimmediate_reward_for_actorは、その手で勝った/引き分けた場合の報酬(1 or 0.5)。負けはなし。
            
            state_tuple = next_state_tuple
        
        # --- エピソード終了 ---
        final_winner = env.winner # 1 (O), -1 (X), 0 (Draw)

        # 報酬の設定
        reward_p1 = 0
        reward_p2 = 0
        if final_winner == 1: # P1 (O) の勝利
            reward_p1 = 1
            reward_p2 = -1
            wins_p1 +=1
        elif final_winner == -1: # P2 (X) の勝利
            reward_p1 = -1
            reward_p2 = 1
            wins_p2 +=1
        elif final_winner == 0: # 引き分け
            # 引き分けの報酬は0.5など、状況に応じて調整
            reward_p1 = 0.5 
            reward_p2 = 0.5
            draws += 1
        
        # エピソードの履歴を逆順に辿りながら学習
        # 最後の状態の価値は0 (ゲーム終了なので)
        # ただし、learnメソッドは次の状態のQ値を使うので、
        # 最後の行動については、done=Trueとして、報酬を直接targetにする。
        
        # 最後の状態 (next_state_tuple) から見た相手の最大Q値は0 (ゲーム終了しているので)
        # last_target_q_from_opponent_pov = 0 
        # これは learn メソッドの done=True の分岐で処理される

        for i in range(len(history_for_learning) -1, -1, -1):
            exp = history_for_learning[i]
            s_hist = exp['state']
            a_hist_coords = exp['action_coords']
            player_acted = exp['player_who_acted']

            # この行動(s_hist, a_hist_coords)の結果、ゲームが終了したか？
            # (i == len(history_for_learning) - 1) は、この行動がエピソードの最後の行動だったことを意味する
            is_final_move_of_episode = (i == len(history_for_learning) - 1)
            
            current_reward_for_actor = 0
            if is_final_move_of_episode: # この手でゲームが終わった
                if player_acted == 1:
                    current_reward_for_actor = reward_p1
                else: # player_acted == -1
                    current_reward_for_actor = reward_p2
            # else: 中間ステップの報酬は0 (マルバツでは)

            # 次の状態と、そこで可能な行動
            # もしこれが最後の行動なら、next_state_for_learn はない (done=Trueで処理)
            # そうでなければ、historyの次の要素が相手の行動なので、その前の状態が next_state
            if is_final_move_of_episode:
                next_s_for_learn = None # 使われない
                next_available_actions_for_learn = [] # 使われない
            else:
                # この行動の次の状態は、次の履歴の state
                next_s_for_learn = history_for_learning[i+1]['state']
                # 次の状態で可能な行動を取得
                temp_env = TicTacToeEnv()
                temp_env.board = np.array(next_s_for_learn).reshape((3,3))
                temp_env.current_player = -player_acted # 次の手番のプレイヤー
                next_available_actions_for_learn = temp_env.get_available_actions()

            agent.learn(
                state_tuple=s_hist,
                action_coords=a_hist_coords,
                reward=current_reward_for_actor, # この行動に対する最終的な報酬 (途中の場合は0)
                next_state_tuple=next_s_for_learn if not is_final_move_of_episode else state_tuple, # doneならnext_stateは使われない
                next_available_actions_coords=next_available_actions_for_learn if not is_final_move_of_episode else [],
                done=is_final_move_of_episode
            )
            
        # ε値を減衰
        agent.decay_epsilon()

        if (episode + 1) % 1000 == 0:
            print(f"Episode {episode + 1}/{num_episodes} finished.")
            print(f"  Epsilon: {agent.epsilon:.4f}")
            print(f"  P1 Wins: {wins_p1}, P2 Wins: {wins_p2}, Draws: {draws}")
            # 学習の進捗を見るために、直近1000エピソードの勝率をリセットしても良い
            wins_p1, wins_p2, draws = 0, 0, 0 


    # 学習後、Qテーブルを保存
    agent.save_q_table(q_table_filename)
    print("Training finished.")

if __name__ == '__main__':
    # パラメータ設定
    episodes = 2000      # 学習エピソード数
    alpha_val = 0.1       # 学習率
    gamma_val = 0.99      # 割引率
    epsilon_s = 1.0       # 初期ε
    epsilon_d = 0.9995   # ε減衰率 (10000エピソードで約0.006まで減衰, 20000でほぼ最小値)
                          # epsilon_s * (epsilon_d ^ episodes)
    epsilon_m = 0      # 最小ε
    
    # 学習回数とパラメータがわかるようなファイル名にする
    dirname = "q_tables"
    if not os.path.exists(dirname):
        os.makedirs(dirname)
    q_table_file = os.path.join(dirname, f"q_table_ep{episodes}_a{alpha_val}_g{gamma_val}_epsdecay{epsilon_d}.json")

    train(num_episodes=episodes, 
          alpha=alpha_val, 
          gamma=gamma_val, 
          epsilon_start=epsilon_s, 
          epsilon_decay=epsilon_d, 
          epsilon_min=epsilon_m,
          q_table_filename=q_table_file)