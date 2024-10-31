import { CommonModule } from '@angular/common';
import { Component, Type } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Backgammon Game';
  btw2 : number []= [0,1];
  btw6 : number []= [1,2,3,4,5,6];
  btw5 : number []= [1,2,3,4,5];
  brandString = "yyyeler.com";
  imageSrc1 = "assets/img/dice_1.png";
  imageSrc2 = "assets/img/dice_1.png";
  userOrder : boolean = true;
  remainDice : boolean = true;
  remainingMoves : number[] = []; 
  holdingValue : number = -1;
  grave : number[] = [0,0];

  field : Field[]= [{value : 2,user : 2},{value : 0,user : 0},{value : 0,user : 0},{value : 0,user : 0},{value : 0,user : 0},{value : 5,user : 1},
                    {value : 0,user : 0},{value : 3,user : 1},{value : 0,user : 0},{value : 0,user : 0},{value : 0,user : 0},{value : 5,user : 2},
                    {value : 5,user : 1},{value : 0,user : 0},{value : 0,user : 0},{value : 0,user : 0},{value : 3,user : 2},{value : 0,user : 0},
                    {value : 5,user : 2},{value : 0,user : 0},{value : 0,user : 0},{value : 0,user : 0},{value : 0,user : 0},{value : 2,user : 1}];               

  shakeDice()
  {
    let dice1 = Math.floor(Math.random() * 6)+1;
    let dice2 = Math.floor(Math.random() * 6)+1;

    if(dice1 === dice2) this.remainingMoves = [dice1,dice1,dice1,dice1];
    else this.remainingMoves = [dice1,dice2];

    this.imageSrc1 = this.getDiceUrl(dice1);
    this.imageSrc2 = this.getDiceUrl(dice2);

    this.remainDice = false;
  }

  checkField(val1 : number , val2 : number , val3 : number ,swtch : boolean) : string
  {

    let key = this.calculateKey(val1 , val2  , swtch);

    let cell : Field = this.field[key];


    if(cell.value >= 5)
    {
      if(cell.user === 1) return "yellowCoin";
      else if(cell.user === 2) return "blueCoin";
    }  
    else if(cell.value + val3 >= 6)
    {
      if(cell.user === 1) return "yellowCoin";
      else if(cell.user === 2) return "blueCoin";
    } 
    
    return "";
  }

  finishMoves()
  {
    this.userOrder = !this.userOrder;
    this.remainDice = true;
    this.holdingValue = -1;
  }

  makeMove(val1 : number, val2 : number, swtch : boolean)
  {
    if(this.remainDice) alert("Shake dice first !!!");
    else
    {
      let key = this.calculateKey(val1 , val2  , swtch);
      
      if(this.holdingValue === -1) this.holdingValue = key;
      else 
      {
        if(this.checkIsValid(key))
        {
          this.field[this.holdingValue].value--;
  
          if(this.field[key].user == 0) this.field[key].user = this.field[this.holdingValue].user; 
          this.field[key].value++;
          this.holdingValue = -1;
        }
        else
        {
          this.holdingValue = -1;
          alert("Move is not valid!");
        }
      }
  
      if(this.remainingMoves.length == 0)  this.finishMoves();
    }  
  }

  calculateKey(val1 : number , val2 : number , swtch : boolean)
  {
    let key : number = 0;

    if(swtch)
    {
      if(val1 === 0) key = val2 + 11;
      else           key = val2 + 17;
    }
    else
    {
      if(val1 === 0)
      {
        key = (6-val2)+6;
      }
      else
      {
        key = (6-val2);
      }
    } 

    return key;
  }

  checkIsValid(key : number) : boolean
  {
    let willGraveFill : boolean = false;
    let swtch = (key >= this.holdingValue && this.userOrder) || (key <= this.holdingValue && !this.userOrder);
    if(swtch) return false;
    if(this.field[this.holdingValue].value === 0) return false;
    //if((this.field[key].user !== this.field[this.holdingValue].user) && (this.field[key].user !== 0))  return false;

    if((this.field[key].user !== this.field[this.holdingValue].user) && (this.field[key].user !== 0))
    {
      if(this.field[key].value > 1) return false;
      else willGraveFill = true;
    }  

    let index = this.userOrder ? (this.holdingValue-key) : (key-this.holdingValue); 
    let val = this.remainingMoves.indexOf(index);

    if(val === -1)  return false;
    else 
    {
      if(willGraveFill)
      {
        this.grave[this.field[key].user - 1]++;
        this.field[key].user = 0;
        this.field[key].value = 0;
      }
      this.remainingMoves.splice(val,1);
      return true
    }
    
  }

  getDiceUrl(val : number) : string
  {
    return "assets/img/dice_"+val+".png";
  }

  showGrave()
  {
    return this.grave[0] + this.grave[1] > 0;
  }

  doItemHavePlus(val1 : number , val2 : number , swtch : boolean)
  {
    let key = this.calculateKey(val1 , val2  , swtch);

    if(this.field[key].value > 5)
    {
      return "+"+(this.field[key].value - 5);
    }
    else return "";
  }
}

export type Field =
{
  value : number;
  user : number;
} 