const nba = require('nba');
const fs = require('fs');
const { off } = require('process');

module.exports = {
    get_player_data,
    calculate_score
};

//Needed as can't get list without reaching request limit
var east_teams = ['BOS', 'CHI', 'ATL', 'BKN', 'CLE', 'CHA', 'NYK', 'DET', 'MIA', 'PHI', 'IND', 'ORL', 'TOR', 'MIL', 'WAS'];
var west_teams = ['LAL', 'LAC', 'DEN', 'HOU', 'OKC', 'UTA', 'DAL', 'POR', 'MEM', 'PHX', 'SAS', 'SAC', 'NOP', 'MIN', 'GSW'];


//Gets list of all players from stats.nba.com
function get_player_data(time, slider_values)
{
    return new Promise((resolve, reject) => 
    {
        console.log(time);
        nba.stats.playerStats({SeasonSegment: time}).then(function(data, err)
        {            
            if(err)
            {
                console.log(err);
             }
                
            resolve(filter_all_players(data.leagueDashPlayerStats, slider_values));
        });  
    });
      
}

//Sorts through list of all players
//Only players with >=10 ppg, >=5 ast or >=5 reb
function filter_all_players(player_data, slider_values)
{
    //This is needed as the player stats do not include their positions
    var rosters = JSON.parse(fs.readFileSync('./TeamData/all_rosters.json').toString());

    let all_players = [];
    let maxscore = 0;

    player_data.forEach(function(player)
    {
        if(player.pts >= 10 || player.reb >= 5 || player.ast >= 5)
        {
            let cur_score = calculate_score(player, slider_values.Off_value, slider_values.Def_value, slider_values.Win_value, slider_values.Play_value);
            all_players.push({Name: player.playerName, Score: cur_score, Stats: player});
            maxscore = Math.max(maxscore, cur_score);
        }
    });

    possibleallstars = all_players.filter(player => player.Score > (maxscore*0.3));
    possibleallstars.sort((a, b) => b.Score - a.Score);

    return sort_positions(possibleallstars, rosters);
}

//Calculates player score based on player's stats
function calculate_score(player, offvalue, defvalue, winvalue, playvalue)
{
    let score = 0;

    offvalue = slider_equation(offvalue);
    defvalue = slider_equation(defvalue);
    winvalue = slider_equation(winvalue);
    playvalue = slider_equation(playvalue);

    
    //PTS - USES TS%
    score += offvalue * 5 * player.pts * (player.pts / (2 * player.fga + 0.44 * player.fta));

    //AST - USES TO%
    score += offvalue * ((player.ast - player.tov) * 7);

    //REB
    score += offvalue * (player.oreb * 6) + defvalue * (player.dreb * 6);

    //STL & BLK
    score += defvalue * ((player.stl * 3) + (player.blk * 2));

    //FOULS
    score -= defvalue * (player.pf * 3);

    //W/L BOOSTS
    score += winvalue * (25 * player.wPct);

    //Minutes
    score -= playvalue * (3 * (36 - player.min));

    //GP Bonus
    score += playvalue * (player.gp /3);

    //Plus / Minus
    score += winvalue * (3 * player.plusMinus);
    
    return score;
};

//Returns Arrays of the All stars
function sort_positions(players_data, rosters_data)
{
    //All star works 2 Backcourt 3 Frontcourt **Since 2013
    //Then for Bench it is Two more Backcourt Three frontcourt and Two WildCards
    //Backcourt -> Guards 
    //Front court -> Forwards / Centers

    let backcourt_east = [];
    let frontcourt_east = [];
    let wildcard_east = [];

    let backcourt_west = [];
    let frontcourt_west = [];
    let wildcard_west = [];
    

    players_data.forEach(player => 
    { 
        if(east_teams.findIndex(team_name => team_name === player.Stats.teamAbbreviation) !== -1)
        {
            team_index = rosters_data.findIndex(team => team.teamAbbreviation == player.Stats.teamAbbreviation);
            player_index = rosters_data[team_index].commonTeamRoster.findIndex(player_to_find => player_to_find.player === player.Name);

            if(rosters_data[team_index].commonTeamRoster[player_index].position === 'G' || rosters_data[team_index].commonTeamRoster[player_index].position === 'G-F')
            {
                if(backcourt_east.length < 4)
                {
                    backcourt_east.push(player);
                } else 
                {
                    wildcard_east.push(player);
                }
            } else
            {
                if(frontcourt_east.length < 6)
                {
                    frontcourt_east.push(player);
                } else 
                {
                    wildcard_east.push(player);
                }
            }
        } else 
        {
            team_index = rosters_data.findIndex(team => team.teamAbbreviation == player.Stats.teamAbbreviation);
            player_index = rosters_data[team_index].commonTeamRoster.findIndex(player_to_find => player_to_find.player === player.Name);

            if(rosters_data[team_index].commonTeamRoster[player_index].position === 'G' || rosters_data[team_index].commonTeamRoster[player_index].position === 'G-F')
            {
                if(backcourt_west.length < 4)
                {
                    backcourt_west.push(player);
                } else 
                {
                    wildcard_west.push(player);
                }
            } else 
            {
                if(frontcourt_west.length < 6)
                {
                    frontcourt_west.push(player);
                } else 
                {
                    wildcard_west.push(player);
                }
            }
        }
    });

    //Wild Card
    wildcard_east = sortwildcards(wildcard_east);
    wildcard_west = sortwildcards(wildcard_west);

    let Starters_East = [backcourt_east[0], backcourt_east[1], frontcourt_east[0], frontcourt_east[1], frontcourt_east[2]];
    let Starters_West = [backcourt_west[0], backcourt_west[1], frontcourt_west[0], frontcourt_west[1], frontcourt_west[2]];

    let Bench_East = [backcourt_east[2], backcourt_east[3], frontcourt_east[3], frontcourt_east[4], wildcard_east[0], wildcard_east[1]];
    let Bench_West = [backcourt_west[2], backcourt_west[3], frontcourt_west[3], frontcourt_west[4], wildcard_west[0], wildcard_west[1]];

    return {Starters_E: Starters_East, Starters_W: Starters_West, Bench_E: Bench_East, Bench_W: Bench_West};
};

//Sorts Wildcard array
function sortwildcards(playerstosort)
{
    playerstosort.sort((a, b) => b.Score - a.Score);

    return [playerstosort[0], playerstosort[1]];
}

//Value slider is based on quadratic 
function slider_equation(val)
{
    return (4.5 * Math.pow(val,2) - (0.75 * val) + 0.25);
}

//Used to create roster file as stats.nba.com does not allow enough requests to do this everytime
function create_team_rosters()
{
    let teamdata = JSON.parse(fs.readFileSync('./TeamData/team_ids.json').toString());
    let rosters_data = [];
    for(let i = 0; i < 30; i++)
    {
        nba.stats.commonTeamRoster({TeamID: teamdata[i].teamId}).then(function(data)
        {
            rosters_data.push(data);
            console.log(data);
    
            fs.appendFileSync('rosters.txt',JSON.stringify(data, null, ' '));
    
        }); 
    }
    return rosters_data;
}