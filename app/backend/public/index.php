<?php
header('Access-Control-Allow-Origin: *');
$filename='game.txt';

if(!file_exists($filename)){
    file_put_contents($filename,"0,0,0,0,0,0,0,0,0");
}

$current_state=file_get_contents($filename);
$board_array=explode(",",$current_state); 

if(isset($_GET['reset'])){
    $empty_board="0,0,0,0,0,0,0,0,0";
    file_put_contents($filename,$empty_board);
    echo $empty_board;
    exit;
}

if(isset($_GET['click'])){
    $index=$_GET['click'];
    if($board_array[$index]=="0"){
        $countX=0;
        $countO=0;
        foreach($board_array as $cell){
            if($cell=="X")$countX++;
            if($cell=="O")$countO++;
        }
        if($countX==$countO){
            $board_array[$index]="X";
        }else{
            $board_array[$index]="O";
        }
        $current_state=implode(",",$board_array);
        file_put_contents($filename,$current_state);
    }
}

$winner="";
$b=$board_array;
$lines=[
    [0,1,2],[3,4,5],[6,7,8], 
    [0,3,6],[1,4,7],[2,5,8], 
    [0,4,8],[2,4,6]             
];

foreach($lines as $line){
    if($b[$line[0]]!="0" && $b[$line[0]]==$b[$line[1]] && $b[$line[1]]==$b[$line[2]]){
        $winner=$b[$line[0]];
    }
}

if($winner!=""){
    echo"WINNER:".$winner;
}elseif(!in_array("0",$board_array)){
    echo"DRAW";
}else{
    echo $current_state;
}
?>