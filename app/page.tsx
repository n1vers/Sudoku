"use client";
import{useState,useEffect}from'react';

export default function Game(){
const[cells,setCells]=useState(["0","0","0","0","0","0","0","0","0"]);
const[winner,setWinner]=useState<string|null>(null);
const[isDraw,setIsDraw]=useState(false);
const[isClient,setIsClient]=useState(false);

useEffect(()=>{
  setIsClient(true);
  updateBoard();
},[]);

const handleServerResponse=(text:string)=>{

  if(text.includes("WINNER:")){
  setWinner(text.split(":")[1]);
  setIsDraw(false);

  }else if(text==="DRAW"){
  setIsDraw(true);
  setWinner(null);

  }else{
  setCells(text.split(","));
  setWinner(null);
  setIsDraw(false);
  }
};

function updateBoard(){
  fetch('http://localhost:8000/index.php')
  .then(res=>res.text())
  .then(handleServerResponse);
}

function handleClick(index:number){
  if(winner||isDraw||cells[index]!=="0")return;
  fetch('http://localhost:8000/index.php?click='+index)
  .then(res=>res.text())
  .then(handleServerResponse);
}

function resetGame(){
  fetch('http://localhost:8000/index.php?reset=yes')
  .then(res=>res.text())
  .then(handleServerResponse);
}

if(!isClient)return null;

return(
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',fontFamily:'monospace'}}>
  <h1>TIC TAC TOE</h1>

  <div style={{marginBottom:'10px'}}>
    {winner&&<h2>ПОБЕДА:{winner}</h2>}
    {isDraw&&<h2>НИЧЬЯ</h2>}
    {!winner&&!isDraw&&<p>ХОДИТ:{cells.filter(c=>c!=="0").length%2===0?"X":"O"}</p>}
  </div>

  <div style={{display:'grid',gridTemplateColumns:'repeat(3,80px)',border:'1px solid #000'}}>
  {cells.map((cell,i)=>(
    <button key={i} onClick={()=>handleClick(i)} style={{width:'80px',height:'80px',fontSize:'24px',border:'1px solid #000',background:'#fff',cursor:'pointer',borderRadius:'0'}}>
      {cell==="0"?"":cell}
    </button>
  ))}
  </div>
    <button onClick={resetGame} style={{marginTop:'20px',background:'#fff',border:'1px solid #000',cursor:'pointer'}}>
    ЗАНОВО
    </button>
  </div>
);
}