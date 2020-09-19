# nba_allstar_predictor

--------------------------------------
### How the NBA All-Star Selection Works

* The NBA has an all-star game every year, and the players are chosen through a mix of media, player and community voting.
* There can only be 12 players from either the Eastern or Western conference
* There are 4 Backcourt players (Point guard, shooting guard)
* There are 6 Frontcourt players (Small Forward, Power Forward, Center)
* There are 2 Wildcards that can be any position
* The highest voted start in the all-star game, while the next start on the bench
--------------------------------------

### How are player sorted?
The program gives each player a numerical score based on their statistics for the period selected.
The user can also choose what he/she values more.

![Value selector](/images_readme/mainscreen.PNG)

  PTS - USES TS%
    score += offvalue * 5 * player.pts * (player.pts / (2 * player.fga + 0.44 * player.fta));

  AST - USES TO%
    score += offvalue * ((player.ast - player.tov) * 7);

  REB
    score += offvalue * (player.oreb * 6) + defvalue * (player.dreb * 6);

  STL & BLK
    score += defvalue * ((player.stl * 3) + (player.blk * 2));

  FOULS
    score -= defvalue * (player.pf * 3);

   W/L BOOSTS
    score += winvalue * (25 * player.wPct);

   Minutes
    score -= playvalue * (3 * (36 - player.min));

   GP Bonus
    score += playvalue * (player.gp /3);

   Plus / Minus
    score += winvalue * (3 * player.plusMinus);

--------------------------------------

## Results

Results are shown by conference and by who would start in the all-star game.
Player's names are all links to their stats.nba.com pages

![all_Star_results](/images_readme/playerscreen.PNG)
