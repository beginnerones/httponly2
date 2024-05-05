const http=require('http');  //기본적으로 통신할 HTTP모듈입니다
const dotenv=require('dotenv'); //env파일을 일기 위한 모듈입니다.
const url=require('url'); //url부분을 구별하기 위해 사용하는 모듈입니다.
const dfs_xy_conv = require('./convert'); //이부분은 위도,경도에 대한 정보를 x,y값으로 바꿔주는 모듈입니다.

dotenv.config(); //env파일 읽기 위해서 설정합니다.

const port=process.env.PORT || 8080;  //기본적인 포트번호로서 사용하기 위해 작성하였습니다.


let parseurl=''; //요청에 요청을 받아서 각각 경로를 구별해주기 위해서 사용하여 줍니다.이것을 안쓸시 쿼리스트링을 사용하기 힘듭니다.
const option={ //api에 url부분을 담습니다.
    hostname:'', //기본적인 주소를 작성합니다
    port:80,
    path:'', //주소 뒤에 경로부분과 매개변수를 작성하는 부분입니다.
    method: '', //get방식인지 post방식인지를 선택합니다.
};

http.createServer(async(req,res)=>{  //서버를 생성합니다.
    try{
        parseurl=url.parse(req.url,true);//이곳에서 요청 url부분을 담습니다.이제 자유롭게 퀴리스트링이 가능해 집니다.
        if(req.method=='GET'){  //만약 get방식으로 클라이언트가 호출할시
            option.method= 'GET';
            if(req.url=='/'){// 기본경로입니다.그냥 처음 경로를 입력하지않고 들어올시 수행됩니다.
                res.writeHead(200, {'Content-Type': 'application/json'}); //헤더 부분에 정상호출되었다는 200코드와 반환타입을 작성합니다.
                res.end(JSON.stringify({message: "날씨와 미세먼지 정보 조회를 해주는 api입니다."}));
            }else if(parseurl.pathname=='/api/dust'){ //기본경로로 접근시 시,도지역을 기준으로하여 미세먼지정보를 반환해 줍니다.
                 
                const location=parseurl.query.location; //시도에 이름을 쿼리스트링으로 작성해주시면 됩니다.(서울,울산,대구,전역등)
                console.log(location);
                option.hostname='apis.data.go.kr';  //api에 기본 주소를 작성하여 줍니다.
                option.path=`/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty?serviceKey=${process.env.KEY}&returnType=json&numOfRows=100&pageNo=1&sidoName=${encodeURIComponent(location)}`;
                //api에 경로와 서비스키,시도,리턴타입,페이지넘버,한페이지에 몇개의 정보를 보여주는지 등의 정보를 작성해줍니다.
                const api=http.request(option,(apiRes)=>{ //해당 api주소로 외부api에 http요청을 보냅니다.
                    
                    let data=''; 
                    apiRes.on('data',(chuck)=>{ //api주소로 요청한 데이터 조각들을 하나의 데이터로 모읍니다.
                        data+=chuck;
                    });
                    apiRes.on('end',()=>{ //더이상 올데이터가 없을시 실행됩니다.
                        try{
                            console.log(data);
                            const result=JSON.parse(data); //데이터를 js객체로 변환하여 줍니다.
                            res.writeHead(200, {'Content-Type': 'application/json'});   // 클라이언트에게 성공적으로 데이터를 받았다는 HTTP 상태 코드 200을 설정합니다.
                            res.end(JSON.stringify(result)); //해당 데이터를 다시 json으로 변환하여 클라이언트에게 반환합니다.
                        }catch(error){//만약 데이터 변환중 에러가 나올시 이곳이 실행되며 500코드를 클라이언트에게 보냅니다.
                            console.error(error)
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api.on('error',(err)=>{ //http요청중 발생하는 모든 에러들을 처리하는 부분입니다
                    console.error(err); //콘솔에 에러 메세지를 출력
                    res.writeHead(500,{'Content-Type':'application/json'})//클라이언트에게 500코드와 함께 json으로 메시지를 전송합니다.
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api.end();
            }else if(parseurl.pathname=='/api/dust/ultra'){//이 부분은 초미세먼지에 주간예보에 대한 정보를 조회하는 api라우터 부분입니다.
                
                const day=parseurl.query.day; //조회할 날짜를 파라미터 로서 작성하여 줍니다.(2024-05-05)
                
                option.hostname='apis.data.go.kr';  //api에 기본 주소를 작성하여 줍니다.
                option.path=`/B552584/ArpltnInforInqireSvc/getMinuDustWeekFrcstDspth?serviceKey=${process.env.KEY}&returnType=json&numOfRows=100&pageNo=1&searchDate=${encodeURIComponent(day)}`;
                //api에 경로와 서비스키,조회 날짜,리턴타입등의 정보를 작성해줍니다.
                const api=http.request(option,(apiRes)=>{ //해당 api주소로 외부api에 http요청을 보냅니다.
                    let data=''; 
                    apiRes.on('data',(chuck)=>{ //api주소로 요청한 데이터 조각들을 하나의 데이터로 모읍니다.
                        data+=chuck;
                    });
                    apiRes.on('end',()=>{ //더이상 올데이터가 없을시 실행됩니다.
                        try{
                            const result=JSON.parse(data); //데이터를 js객체로 변환하여 줍니다.
                            res.writeHead(200, {'Content-Type': 'application/json'});   // 클라이언트에게 성공적으로 데이터를 받았다는 HTTP 상태 코드 200을 설정합니다.
                            res.end(JSON.stringify(result)); //해당 데이터를 다시 json으로 변환하여 클라이언트에게 반환합니다.
                        }catch(error){//만약 데이터 변환중 에러가 나올시 이곳이 실행되며 500코드를 클라이언트에게 보냅니다.
                            res.writeHead(500, {'Content-Type': 'application/json'});
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api.on('error',(err)=>{ //http요청중 발생하는 모든 에러들을 처리하는 부분입니다
                    console.error(err); //콘솔에 에러 메세지를 출력
                    res.writeHead(500,{'Content-Type':'application/json'})//클라이언트에게 500코드와 함께 json으로 메시지를 전송합니다.
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api.end();
            }
            else if(parseurl.pathname=='/api/zio'){ //작성한 장소,주소에 x,y좌표를 조회 해주는 라우터 부분입니다.
                let type=parseurl.query.type; // 도로명주소로 작성할지 지번주소로 작성할지 선택합니다.
                if(type=='지번명'){ //지번명으로 입력시
                    type=encodeURIComponent('PARCEL');
                }else if(type =='도로명'){ //도로명으로 입력시
                    type=encodeURIComponent('ROAD');
                }else{ //기본값
                type=encodeURIComponent('PARCEL');
                }
                const address=encodeURIComponent(parseurl.query.address); //조회할 주소를 작성하여 줍니다.
                option.hostname='api.vworld.kr'; //api url부분입니다.
                option.path=`/req/address?key=${process.env.ZIO}&service=address&request=GetCoord&format=json&crs=epsg:4326&type=${type}&address=${address}`;
                //경로와 매개변수로 서비스키,주소,도로,지번명등을 작성해줍니다.
                const api2=http.request(option,(apiRes)=>{  //해당 api url주소로 http요청을 보내주는 부분입니다.
                    let data='';
                    apiRes.on('data',(chuck)=>{
                        data+=chuck;  //api호출 결과로 오는 데이터조각을 하나의 데이터로 받아줍니다.
                    });
                    apiRes.on('end',()=>{
                        try{
                            const result=JSON.parse(data); //js객체로 변환하여 정렬하여 줍니다. 
                            res.writeHead(200, {'Content-Type': 'application/json'});//변환이 정상적으로 되었으므로 200코드와 메시지를 전송해 줍니다.
                            res.end(JSON.stringify(result));
                        }catch(error){ //만약 json변환과 전송중 문제 발생시 호출되는 부분입니다.
                            res.writeHead(500, {'Content-Type': 'application/json'}); //500코드와 메시지를 보냅니다.
                            res.end(JSON.stringify({message: "데이터 파싱 중 에러가 발생했습니다."}));
                        }
                    });
                });
                api2.on('error',(err)=>{ //http에서 전체적으로 발생하는 오류를 잡아주는 부분입니다.
                    console.error(err); //콘솔로 해당 오류를 확인할수 있게 합니다.
                    res.writeHead(500,{'Content-Type':'application/json'}) //500오류코드와 메세지를 전송해줍니다.
                    res.end(JSON.stringify({message: "api호출을 하지 못하였습니다."}));
                })
                api2.end();
            }
            else{//get요청중 없는 라우터경로를 입력시
                res.writeHead(404,{'Content-Type':'application/json'});
                res.end(JSON.stringify({message:"라우터가 없습니다."}));
            }
        }else if(req.method==='POST'){ //이번에는 post 방식으로 요청시 응답해주는 부분입니다.
            if(parseurl.pathname=='/api/weather/search'){ //이 부분에서는 단기날씨예보정보를 조회할수 있는 부분입니다.
                let today=new Date();  //년,월,일등의 시간과 관련된 부분입니다.
                let body='';
                req.on('data',(data)=>{ //클라이언트에서 body부분에 데이터를 보낸것들을 부분부분 전송해 하나로 입력받습니다.
                    body+=data;
                });
                req.on('end',()=>{ //위에 데이터를 다 받아와 전송할 데이터가 없을시 실행 됩니다.
                    const result1=JSON.parse(body);  //js객체로 변환합니다.
                    let x=result1.x; //post로 받은데이터인 x,y값들을 조회를 위해 변수에 저장합니다.
                    let y=result1.y;
                    const result2=dfs_xy_conv("toXY",y,x); //이부분에서 위도경도를 x,y값으로 변환해주기위해 dfs_xy_conv모듈을 통해 변환후 값을 다시 받습니다.

                    let year=String(today.getFullYear()); //이 부분들은 초단기예보정보로서 현재 날짜,시간을 기준으로 조회를하게 코드를 구성하였습니다.
                    let month=String(today.getMonth()+1); //현재 월을 입력받습니다.
                    let daysq=String(today.getDate()); //현재 일을 입력받습니다.

                    month = month.padStart(2, '0'); //이 두부분은 숫자가 한자리인것을 대비해 10의자리에 수가 비어있을시 0으로 채워주는 부분입니다.
                    daysq = daysq.padStart(2, '0');

                    year+=month+daysq;//여기서 해당 변수들을 다 합쳐줍니다.
                    console.log(year)

                    let time=today.getHours(); //현재 시간을 입력받아 줍니다.
                    let min=today.getMinutes(); //현재 분을 입력받습니다.
                    if(min<=45) time=time-1; //해당 api에서는 데이터 갱신을 해당시간에 45분이후부터 받을수 있기에 이시간보다 적을시 시 부분을 하나 줄여줍니다.
                    if(time<0) time=23; //만약 위에서 -1을했는데 00시라면 23시로 돌립니다.
                    let timestring =encodeURIComponent(time.toString().padStart(2, '0') + '30'); //시간,분 부분을 합쳐줍니다.padstart부분은 위와마찬가지로 십의자리에0을 채워줍니다.

                    console.log(timestring)
                    let mx=encodeURIComponent(String(result2.x)); //x,y로 변환한 값들을 매개변수 조회를 위해 string으로 변환후 사용합니다.
                    let my=encodeURIComponent(String(result2.y));
                    console.log(mx);
                    console.log(my);
                    body=JSON.parse(body); //node에서 사용할수 있도록 js객체로 만들어 줍니다.
                   
                    const address=encodeURIComponent(body.address); //body에 입력한 주소를 api조회하기위해서 파라미터 값으로 넣어줍니다.
                    option.hostname='apis.data.go.kr';
                    option.path=`/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst?serviceKey=${process.env.KEY}&numOfRows=10&pageNo=1&dataType=json&base_date=${encodeURIComponent(year)}&base_time=${timestring}&nx=${mx}&ny=${my}`;
                    option.method="GET" //api주소와 경로,매개변수들을 작성하여 줍니다.

                    const api2=http.request(option,(apiRes)=>{ //api주소에 http요청을 통해서 json데이터를 받습니다.
                        let data='';
                        apiRes.on('data',(chuck)=>{ //data변수에 하나로 데이터들을 모읍니다.
                            data+=chuck;
                        });
                        apiRes.on('end',async()=>{ //데이터들이 더이상 오지않을시 실행됩니다.
                            let result=JSON.parse(data); //모은 데이터를 사용하기위해 js객체로 변환해 줍니다.
                            console.log(result);
                               
                            res.writeHead(200, {'Content-Type': 'application/json'}); //여기까지 제대로 저장시에 200코드와 성공메세지를 전송해줍니다.
                            res.end(JSON.stringify(result));
                        });
                    });
                    api2.on('error',(err)=>{ //api요청과 데이터베이스 저장할때 문제가 생길시
                        console.error(err); //콘솔에 에러메세지를 출력해주고 클라이언트에 오류메세지와 500코드를 전송합니다.
                        res.writeHead(500,{'Content-Type':'application/json'})
                        res.end(JSON.stringify({message: "외부 api호출 요청 실패."}));
                    });
                    api2.end();
                    
                });
                    
            }
            else{  //post요청중 없는 라우터경로를 입력시
                res.writeHead(404,{'Content-Type':'application/json'});
                res.end(JSON.stringify({message:"라우터가 없습니다."}));
            }
        }else{ //get,post외 다른 요청을 할시.
            res.writeHead(404,{'Content-Type':'application/json'});
            res.end(JSON.stringify({message:"해당 요청은 존재하지 않습니다."}));
        }
    }catch(e){ //응답해주는 도중 예상치 못한 에러 발생시 전송해줍니다.
        res.writeHead(500,{'Content-Type':'application/json'})
        res.end(JSON.stringify({message:e.message}));
    }
}).listen(port,()=>{  //해당 포트번호를 통해서 클라이언트가 연결하는것을 대기합니다.
    console.log(`${port}번 포트에서 대기중.`);
});

