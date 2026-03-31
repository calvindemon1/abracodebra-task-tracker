// def sieve(limit):
//     if limit < 2:
//         return []

//     if limit == 2:
//         return [False, True]

//     if limit == 3:
//         return [False, True, True]

//     res = [False]

//     if limit >= 2:
//         res[2] = True

//     if limit >= 3:
//         res[3] = True

//     for i in range(4, limit + 1):
//         res[i] = False

//     i = 1
//     while i <= limit:
//         j = 1
//         while j <= limit:
//             n = (4 * i * i) + (j * j)
//             if (n <= limit and (n % 12 == 1 or n % 12 == 5)):
//                 res[n] ^= True

//             n = (3 * i * i) + (j * j)

//             if n <= limit and n % 12 == 7:
//                 res[n] ^= True

//             n = (3 * i * i) - (j * j)

//             if (i > j and n <= limit and n % 12 == 11):
//                 res[n] ^= True

//             j += 1
//         i += 1

//     r = 5
//     while r * r <= limit:
//         if res[r]:
//             for i in range(r * r, limit + 1, r * r):
//                 res[i] = False

//         r += 1

//     return res



// def pick_prime(primes, min_size=1000):
//     """returns a suitable prime to use as modulus"""
//     for prime in primes:
//         if prime >= min_size:
//             return prime

//     # if no prime large enough exists, use last one on list
//     return primes[-1]



// def hash(string, modulus):
//     """implements polynomial rolling of string keys"""
//     hash_value = 5381
//     for char in string:
//         # hash = 33 XOR ord(c)
//         hash_value = ((hash_value << 5) + hash_value) ^ ord(char)

//     return hash_value % modulus



// if __name__ == '__main__':
//     # generate primes list to use as modulus
//     primes = sieve(10000) # modify limit based on your needs
//     modulus = pick_prime(primes, 1000)

//     test_array = ["alpha","beta","gamma","delta","epsilon"]

//     for string in test_array:
//         hash_value = hash(string, modulus)
//         print(f"Hash of {string} is {hash_value}")




// import pygame as pg
// import sys
// import time
// from pygame.locals import *

// # initialize variables

// current_player = 'x'
// current_winner = None
// is_draw = None

// WIDTH = 400
// HEIGHT = 400 # Add 100 later for the 
// BACKGROUND = (255, 255, 255)
// LINE_COLOR = (0, 0, 0)

// grid = [[None]*3, [None]*3, [None]*3]

// pg.init()
// FPS = 30
// clock = pg.time.Clock()

// screen = pg.display.set_mode((WIDTH, HEIGHT + 100), 0, 32) # 400 x 500 display
// pg.display.set_caption("Tic Tac Toe")

// size = 80 # size of the X / O marks

// def game_initiating_window():
//     """initializes game window"""
//     pg.display.update()
//     time.sleep(3)
//     screen.fill(BACKGROUND)
//     pg.draw.line(screen, LINE_COLOR, (WIDTH / 3, 0), (WIDTH / 3, HEIGHT), 7)
//     pg.draw.line(screen, LINE_COLOR, (WIDTH / 3 * 2, 0), (WIDTH / 3 * 2, HEIGHT), 7)
//     pg.draw.line(screen, LINE_COLOR, (0, HEIGHT / 3), (WIDTH, HEIGHT / 3), 7)
//     pg.draw.line(screen, LINE_COLOR, (0, HEIGHT / 3 * 2), (WIDTH, HEIGHT / 3 * 2), 7)
//     draw_status()

// def draw_status():
//     """draws the status bar"""
//     global is_draw
//     if current_winner is None:
//         message = current_player.upper() + "'s Turn"
//     else:
//         message = current_winner.upper() + " won !"

//     if is_draw:
//         message = "Game Draw !"

//     font = pg.font.Font(None, 30)
//     text = font.render(message, 1, (255, 255, 255))
//     screen.fill((0, 0, 0), (0, 400, 475, 100))
//     text_rect = text.get_rect(center=(WIDTH / 2, HEIGHT/2))
//     screen.blit(text, text_rect)
//     pg.display.update()

// def check_win():
//     """checks game grid for wins or draws"""
//     global grid, current_winner, is_draw
//     for row in range(0, 3):
//         if (grid[row][0] == grid[row][1] == grid[row][2]) and (grid[row][0] is not None):
//             current_winner = grid[row][0]
//             pg.draw.line(screen, (250, 0, 0), (0, (row + 1)*HEIGHT / 3 - HEIGHT / 6), (WIDTH, (row + 1)*HEIGHT / 3 - HEIGHT / 6), 4)
//             break

//     for col in range(0, 3):
//         if (grid[0][col] == grid[1][col] == grid[2][col]) and (grid[0][col] is not None):
//             current_winner = grid[0][col]
//             pg.draw.line(screen, (250, 0, 0), ((col + 1) * WIDTH / 3 - WIDTH / 6, 0), ((col + 1) * WIDTH / 3 - WIDTH / 6, HEIGHT), 4)
//             break

//     if (grid[0][0] == grid[1][1] == grid[2][2]) and (grid[0][0] is not None):
//         current_winner = grid[0][0]
//         pg.draw.line(screen, (250, 70, 70), (50, 50), (350, 350), 4)

//     if (grid[0][2] == grid[1][1] == grid[2][0]) and (grid[0][2] is not None):
//         current_winner = grid[0][2]
//         pg.draw.line(screen, (250, 70, 70), (350, 50), (50, 350), 4)

//     if (all([all(row) for row in grid]) and current_winner is None):
//         is_draw = True

//     draw_status()

// def drawXO(row, col):
//     """draws the X's and O's on the board"""
//     global grid, current_player
//     if row == 1:
//         pos_x = 50

//     if row == 2:
//         pos_x = WIDTH / 3 + 30

//     if row == 3:
//         pos_x = WIDTH / 3 * 2 + 30

//     if col == 1:
//         pos_y = 25

//     if col == 2:
//         pos_y = HEIGHT / 3 + 30

//     if col == 3:
//         pos_y = HEIGHT / 3 * 2 + 30

//     grid[row-1][col-1] = current_player

//     if current_player == 'x':
//         pg.draw.line(screen, (0, 0, 0), (pos_y, pos_x), (pos_y + size, pos_x + size), 5)
//         pg.draw.line(screen, (0, 0, 0), (pos_y, pos_x + size), (pos_y + size, pos_x), 5)
//         current_player = 'o'
//     else:
//         center = (pos_y + size // 2, pos_x + size // 2)
//         radius = size // 2 - 5
//         pg.draw.circle(screen, (0, 0, 0), center, radius, 5)
//         current_player = 'x'
//     pg.display.update()

// def user_click():
//     """finds the position of the user's click"""
//     x, y = pg.mouse.get_pos()
//     if (x < WIDTH / 3):
//         col = 1
//     elif (x < WIDTH / 3 * 2):
//         col = 2
//     elif (x < WIDTH):
//         col = 3
//     else:
//         col = None

//     if (y < HEIGHT / 3):
//         row = 1
//     elif (y < HEIGHT / 3 * 2):
//         row = 2
//     elif (y < HEIGHT):
//         row = 3
//     else:
//         row = None

//     if (row and col and grid[row-1][col-1] is None):
//         drawXO(row, col)
//         check_win()



// def reset_game():
//     """restarts game on win or draw"""
//     global grid, current_winner, current_player, is_draw
//     time.sleep(3)
//     current_player = 'x'
//     is_draw = False
//     game_initiating_window()
//     current_winner = None
//     grid = [[None]*3, [None]*3, [None]*3]

// game_initiating_window()

// while True: # continue loop until user closes the window
//     for event in pg.event.get(): # check for new events
//         if event.type == QUIT:
//             pg.quit()
//             sys.exit()
//         elif event.type == MOUSEBUTTONDOWN:
//             user_click()
//             if (current_winner or is_draw):
//                 reset_game()
//     pg.display.update()
//     clock.tick(FPS)


