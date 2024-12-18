import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import * as alertifyjs from 'alertifyjs';
import { DialogModule } from 'primeng/dialog';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'game',
  standalone: true,
  imports: [CommonModule, DialogModule,RouterModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  animations: [
    trigger('rotateAnimation', [
      state('falseState', style({ transform: 'rotate(0deg)' })),
      state('trueState', style({ transform: 'rotate(180deg)' })),
      transition('falseState => trueState', animate('0.5s ease-out')),
      transition('trueState => falseState', animate('0.5s ease-out'))
    ])
  ]
})
export class GameComponent implements OnInit {
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
  holdingValue : number = -2;
  grave : number[] = [0,0];
  finished : number[] = [0,0];
  field : Field[] = [];
  winTitles : string[] = [];
  gameType : string | null = null;
  isGameFinised = false;
  soundSwitch = true;

  
  constructor(private route: ActivatedRoute) {}

  ngOnInit()
  {
    this.field = this.getInitialField();    
    this.gameType = this.route.snapshot.paramMap.get('type');

    if(this.gameType == "pc") this.winTitles = ["You won","You lost"];
    else this.winTitles = ["User 1 won","User 2 won"];
  }

   shakeDice()
  {
    let dice1 = Math.floor(Math.random() * 6)+1;
    let dice2 = Math.floor(Math.random() * 6)+1;

    if(dice1 === dice2) this.remainingMoves = [dice1,dice1,dice1,dice1];
    else this.remainingMoves = [dice1,dice2];

    this.remainDice = false;

    this.playAudio("dice");
    this.diceAnimation();

    this.imageSrc1 = this.getDiceUrl(dice1);
    this.imageSrc2 = this.getDiceUrl(dice2);

    
    this.checkGrave();  
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
    this.remainingMoves = [];
    this.userOrder = !this.userOrder;
    this.remainDice = true;
    this.holdingValue = -2;

    if(this.gameType == 'local') this.playAudio("slide"); 
    if((!this.userOrder) && this.gameType == 'pc') this.pcPlays();
  }

  makeMove(val1 : number, val2 : number, swtch : boolean , comeToGrave : boolean)
  {
    if(this.holdingValue === -2) this.playAudio("select");
    if(this.remainDice)
    {
      this.playAudio("error"); 
      alertifyjs.error('Shake dice first !');
    }  
    else
    {
      let key = this.calculateKey(val1 , val2  , swtch);

      if(((this.userOrder && this.grave[0] > 0) || (!this.userOrder && this.grave[1] > 0)) && !(comeToGrave || this.holdingValue == -1 || this.holdingValue == 24)) 
      {
        this.playAudio("error"); 
        alertifyjs.error("You should put coin from the grave to field first !");
        return;
      }

      if(this.holdingValue === -2)
      {
        if(comeToGrave) 
        {
          if((this.userOrder && this.grave[0]>0) || (!this.userOrder && this.grave[1]>0)) this.holdingValue = this.userOrder ? 24 : -1; 
          else
          {
            this.playAudio("error"); 
            alertifyjs.error("Grave is empty!");
            return;
          } 
        }
        else if((this.userOrder && this.field[key].user === 1) || (!this.userOrder && this.field[key].user === 2))
        {
          this.field[key].holdingLight = true;
          this.holdingValue = key;
        } 
        else
        {
          this.playAudio("error"); 
          alertifyjs.error("It is User "+(this.userOrder?"1":"2")+"'s turn!");
        } 
      } 
      else 
      {
        if(this.holdingValue == -1 || this.holdingValue == 24)
        {
          if(this.checkIsValidForGrave(key))
          {
            if(this.userOrder) this.grave[0]--;
            else this.grave[1]--;
            if(this.field[key].user == 0) this.field[key].user = this.userOrder ? 1 : 2; 
            this.field[key].value++;
            this.holdingValue = -2;
            
            this.checkGrave();  
          }
          else this.notValidAlert();
        }
        else 
        {
          this.field[this.holdingValue].holdingLight = false;

          if(comeToGrave)
          {
            key = this.userOrder ? 24 : -1;
            if(this.checkIsValidFinish(key))
            {
              this.field[this.holdingValue].value--;
              if(this.userOrder) this.finished[0]++;
              else this.finished[1]++;
              if(this.field[this.holdingValue].value == 0) this.field[this.holdingValue].user = 0; 
              this.holdingValue = -2;
            }
            else this.notValidAlert();
          }
          else if(this.checkIsValid(key))
          {
            this.field[this.holdingValue].value--;
            if(this.field[key].user == 0) this.field[key].user = this.field[this.holdingValue].user; 
            this.field[key].value++;
            if(this.field[this.holdingValue].value == 0) this.field[this.holdingValue].user = 0; 
            this.holdingValue = -2;
          }
          else this.notValidAlert();
          
        }
      }
      
      this.checkGameIsFinished();

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
    let swtch = (key >= this.holdingValue && (this.userOrder || this.field[this.holdingValue].user == 1)) || (key <= this.holdingValue && (!this.userOrder || this.field[this.holdingValue].user == 2));
    
    if(swtch) return false;
    if(this.field[this.holdingValue].value === 0) return false;

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
      this.playAudio("coin");
      return true
    }
    
  }

  checkIsValidForGrave(key : number) : boolean
  {
    let willGraveFill : boolean = false;
    if(!(this.userOrder && key >= 18 && key<24) && !(!this.userOrder && key >= 0 && key<6)) return false;
    if(this.userOrder)
    {
      if(this.field[key].user == 2)
      {
        if(this.field[key].value > 1) return false;
        else willGraveFill = true;
      }
    }
    else 
    {
      if(this.field[key].user == 1)
        {
          if(this.field[key].value > 1) return false;
          else willGraveFill = true;
        }
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
      this.playAudio("coin");
      return true
    }
  }

  checkIsValidFinish(key : number) : boolean
  { 
    if((this.userOrder && this.grave[0] > 0) || (!this.userOrder && this.grave[1] > 0)) return false;
    if(this.userOrder)
    {
      if(this.field.find((x,i) => (x.user == 1 && i > 5 ))  !== undefined) return false;
    }
    else 
    {
      if(this.field.find((x,i) => (x.user == 2 && i < 18 ))  !== undefined) return false;
    }

    let index = this.userOrder ? (this.holdingValue-key) : (key-this.holdingValue); 
    let val :number;
    if(this.remainingMoves.indexOf(index) !== -1) val = this.remainingMoves.indexOf(index);
    else if(this.remainingMoves.find(x => x > index) !== undefined) val = this.remainingMoves.find(x => x > index) as number;
    else return false;

    this.remainingMoves.splice(val,1);
    this.playAudio("coin");
    return true;
  }

  getDiceUrl(val : number) : string { 
    return "assets/img/dice_"+val+".png";  
  }

  showGraveOrFinishedTable(isGrave : boolean) { 
    return isGrave ? (this.grave[0] + this.grave[1]) > 0 : (this.finished[0] + this.finished[1]); 
  }

  doItemHavePlus(val1 : number , val2 : number , swtch : boolean)
  {
    let key = this.calculateKey(val1 , val2  , swtch);
    
    if(this.field[key].value > 5) return "+"+(this.field[key].value - 5);
    else return "";
  }

  checkGrave()
  {
    let graveValue = this.userOrder ? this.grave[0] : this.grave[1];
    if(graveValue !== 0) this.checkCanPlay(); 
  }

  checkCanPlay()
  {
    let value;

    if(this.userOrder)  value = this.remainingMoves.find(i => ((this.field[24-i].user == 0) || (this.field[24-i].user == 1) || (this.field[24-i].user == 2 && this.field[24-i].value == 1))) === undefined;
    else                value = this.remainingMoves.find(i => ((this.field[i-1].user == 0) || (this.field[i-1].user == 2) || (this.field[i-1].user == 1 && this.field[i-1].value == 1))) === undefined;

    if(value) 
    {
      this.finishMoves();
      if(this.gameType == 'local') alertifyjs.error("You can not put chip in the grave to field !");
    }
  }

  getInitialField() : Field[]
  {
    return [{value : 2,user : 2, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 5,user : 1, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 3,user : 1, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 5,user : 2, holdingLight: false},
            {value : 5,user : 1, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 3,user : 2, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 5,user : 2, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 0,user : 0, holdingLight: false},
            {value : 2,user : 1, holdingLight: false}
          ];   
  }

  checkHoldingLight(val1 : number,val2 : number ,swtch : boolean)
  {
    let key = this.calculateKey(val1 , val2  , swtch);
    return this.field[key].holdingLight;
  }

  checkGameIsFinished()
  {
    if(this.finished[0] == 15 || this.finished[1] == 15) 
    {
      this.isGameFinised = true;
      if(this.gameType == "pc" && this.finished[1] == 15) this.playAudio("lost");
      else this.playAudio("win");
    }
  }

  checkRightField(swtch : boolean) : string
  {
    if(swtch)
    {
      if(this.userOrder)
      {
        return this.grave[0] > 0 ? "yellowCoin" : "";
      } 
      else  
      {
        return this.finished[1] > 0 ? "blueCoin": "";
      }
    }
    else
    {
      if(this.userOrder)
      {
        return this.finished[0] > 0 ? "yellowCoin" : "";
      } 
      else  
      {
        return this.grave[1] > 0 ? "blueCoin": "";
      }
    }
  }

  checkRightFieldValue(swtch : boolean)
  {
    if(swtch)
      {
        if(this.userOrder)
        {
          return this.grave[0] > 0 ? this.grave[0] : "";
        } 
        else  
        {
          return this.finished[1] > 0 ? this.finished[1] : "";
        }
      }
      else
      {
        if(this.userOrder)
        {
          return this.finished[0] > 0 ? this.finished[0] : "";
        } 
        else  
        {
          return this.grave[1] > 0 ? this.grave[1] : "";
        }
      }
  }

  checkRightFieldIsHolding(swtch : boolean) : string
  {
    if(swtch)
      {
        if(this.userOrder)
        {
          return this.holdingValue == 24 ? "holdingLightGrave" : "";
        }
      }
      else
      {
        if(!this.userOrder)
        {
          return this.holdingValue == -1 ? "holdingLightGrave": "";
        }
      }

      return "";
  }

  notValidAlert()
  {
    this.holdingValue = -2;
    this.playAudio("error"); 
    alertifyjs.error("Move is not valid!");
  }

  newGame()
  {
    window.location.reload();    
  }

  pcPlays() 
  {
    this.shakeDice();

    if(this.grave[1] >= this.remainingMoves.length) this.saveFromGraveAll();
    else if(this.grave[1] > 0) 
    {
      this.saveFromGraveAll();
      if(this.remainingMoves.length > 0) this.playRemainMoves();
    }
    else 
    {
      this.playRemainMoves();
    }

    this.finishMoves();
  }

  saveFromGraveAll()
  {
    let usedMoves : number[] = [];
    this.remainingMoves.forEach(x => {
      if((this.field[x-1].user !== 1 || this.field[x-1].value == 1) && this.grave[1] > 0)
      {
        this.grave[1]--;
        if(this.field[x-1].user === 1) this.field[x-1].value = 1;
        else this.field[x-1].value ++;
        this.field[x-1].user = 2;
        usedMoves.push(x);
      }
    });

    if(this.grave[1] < this.remainingMoves.length)
    {
      usedMoves.forEach(i => {
        this.remainingMoves.splice(this.remainingMoves.findIndex(x => x == i),1);
      });
    }
  }
 
  playRemainMoves()
  {
    this.playFinishMoves();
    if(this.remainingMoves.length > 0) this.breakOppLosePer();
    if(this.remainingMoves.length > 0) this.losePoorPer();
    if(this.remainingMoves.length > 0) this.tryToStayAllPerRich();
    if(this.remainingMoves.length > 0) this.makeWorseMove();
  }

  playFinishMoves()
  {
    this.remainingMoves.forEach( x =>
    {
      if(this.checkPCCanFinish(x))
      {
        this.field[x].value--;
        this.finished[1]++;
        if(this.field[x].value == 0) this.field[x].user = 0; 
      }
    });
  }

  checkPCCanFinish(move : number)
  {
    if(this.field.find((x,i) => (x.user == 2 && i < 18 ))  !== undefined) return false;
    let index = 24-move;

    let val :number;
    if(this.field.findIndex( (x,i) =>  i === index)) val = this.remainingMoves.indexOf(move);
    else if(this.remainingMoves.find( (x,i) => i < index) === undefined) val = this.remainingMoves.find(x => x > index) as number;
    else return false;

    this.remainingMoves.splice(val,1);
    return true;
  }

  breakOppLosePer()
  {
    console.log("breakOppLosePer");
    let poorPer : number [] = [];
    this.field.forEach((x,i) => {
      if(x.user == 1 && x.value == 1 )  poorPer.push(i);
    });

    if(poorPer.length > 0) this.killOppPoorPer(poorPer);
  }

  killOppPoorPer(poorPer : number[])
  {
    let remainingMovesDeleted: number[] = [];
    this.remainingMoves.forEach((x,i) => {
      if(poorPer.length > 0)
      {
        let key = poorPer.findIndex(y => y-x >=0 && this.field[y-x].user == 2);
        if(key !== -1) 
        {
          this.field[poorPer[key]].value = 1;
          this.field[poorPer[key]].user = 2;
          this.grave[0]++;
          this.field[poorPer[key]-x].value--;
          if(this.field[poorPer[key]-x].value == 0) this.field[poorPer[key]-x].user = 0;
          poorPer.splice(key,1);
          remainingMovesDeleted.push(i);
        }
      }
    });

    for(let a=(remainingMovesDeleted.length-1); a>=0;a--) this.remainingMoves.splice(a,1);
  }

  losePoorPer()
  {
    console.log("losePoorPer");
    let poorPer : number [] = [];
    this.field.forEach((x,i) => {
      if(x.user == 2 && x.value == 1 )  poorPer.push(i);
    });

    if(poorPer.length > 0) this.makeRichPer(poorPer);
  }

  makeRichPer(poorPer : number[])
  {
    let remainingMovesDeleted = [];
    this.remainingMoves.forEach((x,i) => {
      if(poorPer.length > 0)
      {
        let key = poorPer.findIndex(y => y+x <= 23 && this.field[y+x].user == 2);
        if(key !== -1) 
        {
          this.field[poorPer[key]+x].value++;
          this.field[poorPer[key]].value--;
          if(this.field[poorPer[key]].value == 0) this.field[poorPer[key]].user = 0;
          remainingMovesDeleted.push(i);
        }
      }
      
      remainingMovesDeleted.forEach(a => this.remainingMoves.splice(a,1));
    });
  }

  tryToStayAllPerRich()
  {
    console.log("tryToStayAllPerRich");
    let remainingMovesDeleted : number[] = [];
    let richPers : number[] = [];
    this.field.forEach((x,i) => {
      if(x.user==2 && x.value>1) richPers.push(i);
    });

    this.remainingMoves.forEach((x,i) => {
      richPers.forEach(a => {
        if(richPers.find(b => b == a+x) !== undefined)
        {
          this.field[a+x].value++;
          this.field[a].value--;
          remainingMovesDeleted.push(i);
        }
      });
    });

    remainingMovesDeleted.forEach(a => this.remainingMoves.splice(a,1));
  }

  makeWorseMove()
  {
    console.log("makeWorseMove");
    this.remainingMoves.forEach(a => {
      let key = this.field.findIndex((x,i) => x.user == 2 && (this.field[i+a].user !== 1 || this.field[i+a].value < 2));
      if(key !== -1)
      {
        this.field[key].value--;
        if(this.field[key].value === 0) this.field[key].user = 0;
        this.field[key+a].value = (this.field[key+a].user == 0) ? 1 : this.field[key+a].value+1;
        this.field[key+a].user = 2;
      }
    });

    this.remainingMoves = [];
  }

  playAudio(sound : string){
    if(this.soundSwitch)
    {
      let audio = new Audio();
      audio.src = "../assets/audio/"+sound+".mp3";
      audio.load();
      audio.play();  
    }
  }

  async diceAnimation()
  {
    await (() => {
        for (let i = 0; i < 25; i++) 
          {
            setTimeout(() => {
              this.imageSrc1 = this.getDiceUrl((i % 6) + 1);
              this.imageSrc2 = this.getDiceUrl(((25 - i) % 6) + 1);
            }, i * 10); 
          }
      });
  }

  changeSound()
  {
    this.soundSwitch = !this.soundSwitch;
  }

  getSoundImg()
  {
    return "../assets/img/" +(this.soundSwitch?"sound":"mute")+".png";
  }
}

export type Field =
{
  value : number;
  user : number;
  holdingLight : boolean;
} 


