import numpy as np
import random

class TicTacToeEnv:
    def __init__(self):
        self.board = np.zeros((3, 3), dtype=int)  # 0: 空, 1: プレイヤー1 (O), -1: プレイヤー2 (X)
        self.current_player = 1  # プレイヤー1から開始
        self.done = False
        self.winner = None # 0: 引き分け, 1: プレイヤー1勝利, -1: プレイヤー2勝利

    def reset(self):
        """環境を初期状態に戻す"""
        self.board = np.zeros((3, 3), dtype=int)
        self.current_player = 1
        self.done = False
        self.winner = None
        return self.get_state()

    def get_state(self):
        """現在の盤面状態をタプルとして返す (Qテーブルのキーとして使うため)"""
        return tuple(self.board.flatten())

    def get_available_actions(self):
        """可能な行動(空いているマスの位置)のリストを返す"""
        actions = []
        for i in range(3):
            for j in range(3):
                if self.board[i, j] == 0:
                    actions.append((i, j))
        return actions

    def step(self, action):
        """行動を実行し、次の状態、報酬、ゲーム終了フラグを返す"""
        if self.done:
            raise ValueError("Game is already over.")
        
        row, col = action
        if self.board[row, col] != 0:
            # 不正な手 (既に埋まっているマスを選んだ場合) -> ペナルティを与えて即終了
            # Q学習では通常、エージェントが不正な手を選ばないように実装するが、
            # 万が一選んだ場合の処理として。ここでは強い負の報酬。
            return self.get_state(), -10, True, {"error": "Invalid action"}

        self.board[row, col] = self.current_player
        
        # 勝敗判定
        self.check_winner()

        # プレイヤー交代
        self.current_player *= -1

        # 報酬設計の調整:
        # 行動した結果、勝利したなら +1
        # 行動した結果、引き分けになったなら +0.5
        # 行動した結果、まだゲームが続くなら 0
        # 行動した結果、(次の相手の手番で)敗北したなら -1 (これは少し工夫が必要)
        # 今回はシンプルに、勝利/引き分け/ゲーム継続で報酬を決定し、
        # 敗北の報酬は、相手が勝利したときに、その前の自分の手に紐づける形でQ学習で反映される。
        
        current_reward = 0
        if self.done:
            if self.winner == self.board[row,col]: # 打った手で勝利
                current_reward = 1
            elif self.winner == 0: # 打った手で引き分け
                current_reward = 0.5
            # 負けの報酬は、相手が勝ったときに、その一つ前の自分のQ値が更新されることで反映される
        
        return self.get_state(), current_reward, self.done, {}


    def check_winner(self):
        """勝者を確認し、self.done と self.winner を更新する"""
        # 行チェック
        for i in range(3):
            if abs(np.sum(self.board[i, :])) == 3:
                self.winner = self.board[i, 0]
                self.done = True
                return

        # 列チェック
        for j in range(3):
            if abs(np.sum(self.board[:, j])) == 3:
                self.winner = self.board[0, j]
                self.done = True
                return

        # 対角線チェック
        if abs(np.sum(np.diag(self.board))) == 3:
            self.winner = self.board[0, 0]
            self.done = True
            return
        if abs(np.sum(np.diag(np.fliplr(self.board)))) == 3:
            self.winner = self.board[0, 2]
            self.done = True
            return

        # 引き分けチェック (全てのマスが埋まっているか)
        if not np.any(self.board == 0):
            self.winner = 0 # 引き分け
            self.done = True
            return
        
        self.done = False # まだゲームは終わっていない

    def print_board(self):
        """盤面をコンソールに表示する"""
        symbols = {0: ' ', 1: 'O', -1: 'X'}
        for row in self.board:
            print("|".join([symbols[x] for x in row]))
            print("-----")

# 簡単な動作テスト
if __name__ == '__main__':
    env = TicTacToeEnv()
    env.print_board()

    # 例: (0,0)にプレイヤー1が置く
    state, reward, done, _ = env.step((0,0))
    print(f"State: {state}, Reward: {reward}, Done: {done}")
    env.print_board()

    # 例: (1,1)にプレイヤー2が置く
    if not done:
        state, reward, done, _ = env.step((1,1)) # プレイヤー2の手番
        print(f"State: {state}, Reward: {reward}, Done: {done}")
        env.print_board()

    # 例: (0,1)にプレイヤー1が置く
    if not done:
        state, reward, done, _ = env.step((0,1)) # プレイヤー1の手番
        print(f"State: {state}, Reward: {reward}, Done: {done}")
        env.print_board()

    # 例: (1,0)にプレイヤー2が置く
    if not done:
        state, reward, done, _ = env.step((1,0)) # プレイヤー2の手番
        print(f"State: {state}, Reward: {reward}, Done: {done}")
        env.print_board()

    # 例: (0,2)にプレイヤー1が置く
    if not done:
        state, reward, done, _ = env.step((0,2)) # プレイヤー1の手番
        print(f"State: {state}, Reward: {reward}, Done: {done}")
        env.print_board()