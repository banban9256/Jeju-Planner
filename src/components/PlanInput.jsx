import { useState } from 'react';

function PlanInput(){
    // DB 테이블의 컬럼 같은 느낌 -> 입력 받을 값들을 임시로 들고 있을 상태 변수들

    const [place, setPlace] = useState('');
    const [cost, setCost] = useState('');

    // 일정 등록 버튼을 눌렀을 때 실행 될 함수
    const handleSave = () => {
        //화면에 잘 담겼는지 보는 테스트용 코드
        console.log("저장할 장소:", place);
        console.log("저장할 비용:", cost);

        // 여기에 firebase로 데이터를 insert하는 코드 넣기
    };

    return(
        <div style={{ border: '2px solid blue ', padding:'20px', margin: '20px 0'}}>
            <h3> 새로운 일정 추가하기 </h3>

            <div>
                <label> 장소: </label>
                {/* 사용자가 글자를 입력할 때마다 place 변수에 값 넣기 */}
                <input
                    type="text"
                    placeholder="예: 협재해수욕장"
                    value={place}
                    onChange={(e) => setPlace(e.target.value) } />

            </div>

            <div style={{marginTop:'10px'}}>
                <label> 비용: </label>
                <input
                    type="number"
                    placeholder='예: 12000'
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                />
            </div>

            <button onclick= {handleSave} style={{marginTop:'15px'}}> 
                일정 등록
            </button>

        </div>
    );

}

export default PlanInput;