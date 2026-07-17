import { useState, useEffect } from 'react';
import './App.css';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

function App() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [totalDays, setTotalDays] = useState(3);
  const [startDate, setStartDate] = useState('');
  const [selectedDay, setSelectedDay] = useState('1');
  const activeDay = currentScreen.startsWith('day') ? currentScreen.replace('day', '') : null;

  const getFormattedDate = (dayNum) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    date.setDate(date.getDate() + (Number(dayNum) - 1));
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const [plans, setPlans] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [notices, setNotices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansSnap = await getDocs(collection(db, "plans"));
        setPlans(plansSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const checklistsSnap = await getDocs(collection(db, "checklists"));
        setChecklists(checklistsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const noticesSnap = await getDocs(collection(db, "notices"));
        setNotices(noticesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        const expensesSnap = await getDocs(collection(db, "expenses"));
        setExpenses(expensesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("데이터 불러오기 실패:", error);
      }
    };
    fetchData();
  }, []);

  const [inputTime, setInputTime] = useState('');
  const [inputPlace, setInputPlace] = useState('');
  const [inputChecklist, setInputChecklist] = useState('');
  const [inputNotice, setInputNotice] = useState('');
  const [inputPayer, setInputPayer] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [inputExpenseDesc, setInputExpenseDesc] = useState('');

  const [inputSplits, setInputSplits] = useState([{ name: '', amount: '' }]);
  const addSplit = () => setInputSplits([...inputSplits, { name: '', amount: '' }]);
  const removeSplit = (index) => {
    if (inputSplits.length <= 1) return;
    setInputSplits(inputSplits.filter((_, i) => i !== index));
  };
  const updateSplit = (index, field, value) => {
    const updated = [...inputSplits];
    updated[index] = { ...updated[index], [field]: value };
    setInputSplits(updated);
  };
  const splitTotal = inputSplits.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const expenseTotal = Number(inputAmount) || 0;

  const handleAddPlan = async () => {
    if (!inputTime || !inputPlace) return alert("시간과 장소를 모두 입력해주세요!");
    try {
      const docRef = await addDoc(collection(db, "plans"), { day: selectedDay, time: inputTime, place: inputPlace });
      setPlans([...plans, { id: docRef.id, day: selectedDay, time: inputTime, place: inputPlace }]);
      setInputTime(''); setInputPlace('');
      alert(`${selectedDay}일차 일정이 추가되었습니다`);
    } catch (e) { alert("저장 실패"); }
  };

  const handleAddChecklist = async () => {
    if (!inputChecklist) return alert("체크리스트 내용을 입력해주세요!");
    try {
      const docRef = await addDoc(collection(db, "checklists"), { day: selectedDay, content: inputChecklist });
      setChecklists([...checklists, { id: docRef.id, day: selectedDay, content: inputChecklist }]);
      setInputChecklist('');
      alert(`${selectedDay}일차 체크리스트가 추가되었습니다`);
    } catch (e) { alert("저장 실패"); }
  };

  const handleAddNotice = async () => {
    if (!inputNotice) return alert("공지사항 내용을 입력해주세요!");
    try {
      const docRef = await addDoc(collection(db, "notices"), { day: selectedDay, content: inputNotice });
      setNotices([...notices, { id: docRef.id, day: selectedDay, content: inputNotice }]);
      setInputNotice('');
      alert(`${selectedDay}일차 공지사항이 추가되었습니다`);
    } catch (e) { alert("저장 실패"); }
  };

  const handleAddExpense = async () => {
    if (!inputPayer || !inputAmount || !inputExpenseDesc) return alert("결제자, 금액, 내역을 모두 입력해주세요!");
    const validSplits = inputSplits.filter(s => s.name && s.amount);
    if (validSplits.length === 0) return alert("정산할 인원을 최소 1명 이상 입력해주세요!");
    const totalSplit = validSplits.reduce((sum, s) => sum + Number(s.amount), 0);
    if (totalSplit !== Number(inputAmount)) {
      return alert(`정산 합계(${totalSplit.toLocaleString()}원)가 총 금액(${Number(inputAmount).toLocaleString()}원)과 일치하지 않습니다!`);
    }
    try {
      const splitsData = validSplits.map(s => ({ name: s.name, amount: Number(s.amount) }));
      const expenseData = { day: selectedDay, payer: inputPayer, amount: Number(inputAmount), desc: inputExpenseDesc, splits: splitsData };
      const docRef = await addDoc(collection(db, "expenses"), expenseData);
      setExpenses([...expenses, { id: docRef.id, ...expenseData }]);
      setInputPayer(''); setInputAmount(''); setInputExpenseDesc('');
      setInputSplits([{ name: '', amount: '' }]);
      alert(`${selectedDay}일차 지출 내역이 추가되었습니다`);
    } catch (e) { alert("저장 실패"); }
  };

  const handleDeletePlan = async (id) => {
    if (window.confirm("삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "plans", id));
      setPlans(plans.filter(plan => plan.id !== id));
    }
  };
  const handleEditPlan = async (id, currentPlace) => {
    const updatedPlace = window.prompt("수정할 장소를 입력하세요", currentPlace);
    if (updatedPlace) {
      await updateDoc(doc(db, "plans", id), { place: updatedPlace });
      setPlans(plans.map(plan => plan.id === id ? { ...plan, place: updatedPlace } : plan));
    }
  };

  const handleDeleteChecklist = async (id) => {
    if (window.confirm("삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "checklists", id));
      setChecklists(checklists.filter(item => item.id !== id));
    }
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm("삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "notices", id));
      setNotices(notices.filter(n => n.id !== id));
    }
  };
  const handleEditNotice = async (id, currentContent) => {
    const updatedContent = window.prompt("수정할 공지사항을 입력하세요", currentContent);
    if (updatedContent) {
      await updateDoc(doc(db, "notices", id), { content: updatedContent });
      setNotices(notices.map(n => n.id === id ? { ...n, content: updatedContent } : n));
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("지출 내역을 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "expenses", id));
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const getSettlementData = () => {
    const dayExpenses = expenses.filter(e => e.day === activeDay);
    const personData = {};
    dayExpenses.forEach(expense => {
      if (!personData[expense.payer]) personData[expense.payer] = { paid: 0, consumed: 0 };
      personData[expense.payer].paid += expense.amount;
      if (expense.splits && expense.splits.length > 0) {
        expense.splits.forEach(split => {
          if (!personData[split.name]) personData[split.name] = { paid: 0, consumed: 0 };
          personData[split.name].consumed += split.amount;
        });
      } else {
        personData[expense.payer].consumed += expense.amount;
      }
    });
    const netBalances = Object.entries(personData).map(([name, data]) => ({
      name, paid: data.paid, consumed: data.consumed, net: data.paid - data.consumed
    }));
    const debtors = netBalances.filter(p => p.net < 0).map(p => ({ ...p, amount: Math.abs(p.net) }));
    const creditors = netBalances.filter(p => p.net > 0).map(p => ({ ...p, amount: p.net }));
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    const transfers = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const transferAmount = Math.min(debtors[i].amount, creditors[j].amount);
      if (transferAmount > 0) {
        transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: transferAmount });
      }
      debtors[i].amount -= transferAmount;
      creditors[j].amount -= transferAmount;
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }
    return { netBalances, transfers, dayExpenses };
  };

  const settlementData = isModalOpen && activeDay ? getSettlementData() : { netBalances: [], transfers: [], dayExpenses: [] };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#f4f4f9', padding: '20px', fontFamily: 'sans-serif', position: 'relative' }}>

      {currentScreen === 'main' && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85vh' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px', lineHeight: '1.3', textAlign: 'center' }}>
            ✈️ 떠나요 제주도 ~ ✈️
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>여행 시작일:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px' }}>총 여행 기간:</label>
              <div>
                <input type="number" min="1" value={totalDays} onChange={(e) => setTotalDays(Number(e.target.value))} style={{ padding: '5px', width: '60px', borderRadius: '5px', border: '1px solid #ccc', textAlign: 'center' }} />
                <span style={{ fontSize: '14px', fontWeight: 'bold', marginLeft: '5px' }}>일</span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff6b6b', fontSize: '16px' }}>📢 공지사항</h3>
            {Array.from({ length: totalDays }, (_, i) => String(i + 1)).map(day => {
              const dayNotices = notices.filter(n => n.day === day);
              if (dayNotices.length === 0) return null;
              return (
                <div key={day} style={{ marginBottom: '10px' }}>
                  <strong style={{ fontSize: '13px', color: '#007bff' }}>
                    {startDate ? `${getFormattedDate(day)} (${day}일차)` : `${day}일차`}
                  </strong>
                  <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                    {dayNotices.map(notice => (
                      <li key={notice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{notice.content}</span>
                        <div>
                          <button onClick={() => handleEditNotice(notice.id, notice.content)} style={{ fontSize: '11px', cursor: 'pointer', border: 'none', background: 'none' }}>✏️</button>
                          <button onClick={() => handleDeleteNotice(notice.id)} style={{ fontSize: '11px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>❌</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {notices.length === 0 && <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>등록된 공지사항이 없습니다.</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px', maxHeight: '300px', overflowY: 'auto', padding: '5px' }}>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
              <button key={day} onClick={() => setCurrentScreen(`day${day}`)} style={{ padding: '15px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                {startDate ? `${getFormattedDate(day)} (${day}일차)` : `${day}일차`}
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setCurrentScreen('addInfo')} style={{ padding: '10px 20px', backgroundColor: '#e9ecef', border: 'none', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', color: '#495057', cursor: 'pointer' }}>
              정보추가하기
            </button>
          </div>
        </div>
      )}

      {activeDay && (
        <div>
          <h1 style={{ fontSize: '24px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
            설레는 {activeDay}일차 {startDate && <span style={{ fontSize: '16px', color: '#666' }}>({getFormattedDate(activeDay)})</span>}
          </h1>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#4dabf7' }}>📍 오늘 가는 곳</h3>
            <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', fontSize: '14px', lineHeight: '1.8' }}>
              {plans
                .filter(plan => plan.day === activeDay)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((plan) => (
                  <li key={plan.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '5px 0' }}>
                    <span><strong>{plan.time}</strong> {plan.place}</span>
                    <div>
                      <button onClick={() => handleEditPlan(plan.id, plan.place)} style={{ marginLeft: '5px', fontSize: '12px', cursor: 'pointer', border: 'none', background: 'none' }}>✏️</button>
                      <button onClick={() => handleDeletePlan(plan.id)} style={{ marginLeft: '5px', fontSize: '12px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>❌</button>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          <div style={{ backgroundColor: '#eef1f5', padding: '15px', borderRadius: '10px', marginTop: '15px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#495057' }}>🗺️ 오늘 이동 코스</h3>
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '10px', whiteSpace: 'nowrap' }}>
              {plans
                .filter(plan => plan.day === activeDay)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((plan, index, array) => (
                  <div key={plan.id} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'white', padding: '8px 12px', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                      <span style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{plan.time}</span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>{plan.place}</span>
                    </div>
                    {index < array.length - 1 && (
                      <span style={{ margin: '0 8px', color: '#4dabf7', fontWeight: 'bold', fontSize: '16px' }}>➔</span>
                    )}
                  </div>
                ))}
              {plans.filter(plan => plan.day === activeDay).length === 0 && (
                <span style={{ fontSize: '13px', color: '#999' }}>아직 등록된 일정이 없습니다.</span>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#20c997' }}>✅ 체크리스트</h3>
            <div style={{ fontSize: '14px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {checklists.filter(item => item.day === activeDay).map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" style={{ transform: 'scale(1.2)' }} /> {item.content}
                  </label>
                  <button onClick={() => handleDeleteChecklist(item.id)} style={{ fontSize: '12px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>삭제</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ff922b' }}>💸 오늘 사용한 금액</h3>
            <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', fontSize: '14px', lineHeight: '1.8' }}>
              {expenses.filter(e => e.day === activeDay).map((expense) => (
                <li key={expense.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '5px 0' }}>
                  <div>
                    <span>{expense.desc}: <strong>{expense.amount.toLocaleString()}원</strong> <span style={{ color: '#888', fontSize: '12px' }}>(결제: {expense.payer})</span></span>
                    {expense.splits && expense.splits.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        정산: {expense.splits.map(s => `${s.name} ${s.amount.toLocaleString()}원`).join(' · ')}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleDeleteExpense(expense.id)} style={{ marginLeft: '5px', fontSize: '12px', color: 'red', cursor: 'pointer', border: 'none', background: 'none' }}>❌</button>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff4e6', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#d9480f' }}>
              오늘 총 {expenses.filter(e => e.day === activeDay).reduce((sum, curr) => sum + curr.amount, 0).toLocaleString()}원을 사용했습니다!
            </div>
          </div>

          <button onClick={() => setIsModalOpen(true)} style={{ padding: '15px 20px', marginTop: '25px', backgroundColor: '#ffd43b', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', width: '100%', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            정산하기
          </button>

          <button onClick={() => setCurrentScreen('main')} style={{ padding: '10px', marginTop: '30px', width: '100%', backgroundColor: 'transparent', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>
            ← 메인으로 돌아가기
          </button>
        </div>
      )}

      {currentScreen === 'addInfo' && (
        <div>
          <h1 style={{ fontSize: '24px', borderBottom: '2px solid #333', paddingBottom: '10px' }}>
            📝 정보 추가하기
          </h1>

          <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <label style={{ fontWeight: 'bold', marginRight: '10px', fontSize: '16px' }}>몇 일차인가요?</label>
            <input type="number" min="1" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} style={{ padding: '8px', width: '70px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '15px', outline: 'none' }} />
            <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
              일차 {startDate && <span style={{ color: '#666', fontSize: '14px' }}>({getFormattedDate(selectedDay)})</span>}
            </span>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ff6b6b' }}>📢 공지사항 등록</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="text" value={inputNotice} onChange={(e) => setInputNotice(e.target.value)} placeholder="공지사항을 입력하세요" style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <button onClick={handleAddNotice} style={{ padding: '8px 15px', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>추가</button>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#4dabf7' }}>새로운 일정 등록</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="time" value={inputTime} onChange={(e) => setInputTime(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <input type="text" value={inputPlace} onChange={(e) => setInputPlace(e.target.value)} placeholder="어디로 가시나요?" style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <button onClick={handleAddPlan} style={{ padding: '8px 15px', backgroundColor: '#4dabf7', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>추가</button>
            </div>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ff922b' }}>💸 새로운 지출 내역 등록</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" value={inputExpenseDesc} onChange={(e) => setInputExpenseDesc(e.target.value)} placeholder="어디서 사용했나요? (예: 고기국수)" style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <div style={{ display: 'flex', gap: '5px' }}>
                <input type="text" value={inputPayer} onChange={(e) => setInputPayer(e.target.value)} placeholder="결제자" style={{ flex: 1, minWidth: '60px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                <input type="number" value={inputAmount} onChange={(e) => setInputAmount(e.target.value)} placeholder="금액" style={{ flex: 1, minWidth: '80px', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#845ef7' }}>💰 정산할 인원 (사용 내역)</h4>
              {inputSplits.map((split, index) => (
                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '6px', alignItems: 'center' }}>
                  <input type="text" placeholder="이름" value={split.name} onChange={(e) => updateSplit(index, 'name', e.target.value)} style={{ flex: 1, padding: '7px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', minWidth: '50px' }} />
                  <input type="number" placeholder="사용금액" value={split.amount} onChange={(e) => updateSplit(index, 'amount', e.target.value)} style={{ flex: 1, padding: '7px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '13px', minWidth: '70px' }} />
                  <button onClick={() => removeSplit(index)} style={{ padding: '4px 6px', fontSize: '12px', color: '#ff6b6b', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 'bold' }}>✕</button>
                </div>
              ))}
              <button onClick={addSplit} style={{ padding: '5px 10px', backgroundColor: '#e9ecef', border: 'none', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                + 인원 추가
              </button>
              <div style={{
                padding: '6px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold',
                backgroundColor: splitTotal === expenseTotal && expenseTotal > 0 ? '#d3f9d8' : '#fff3bf',
                color: splitTotal === expenseTotal && expenseTotal > 0 ? '#2b8a3e' : '#e67700'
              }}>
                사용 합계: {splitTotal.toLocaleString()}원 / 총 금액: {expenseTotal.toLocaleString()}원
                {expenseTotal > 0 && (splitTotal === expenseTotal ? ' ✓ 일치' : ' ≠ 불일치')}
              </div>
            </div>

            <button onClick={handleAddExpense} style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ff922b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontSize: '14px', fontWeight: 'bold' }}>지출 내역 추가</button>
          </div>

          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', marginTop: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#20c997' }}>✅ 새로운 체크리스트 등록</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="text" value={inputChecklist} onChange={(e) => setInputChecklist(e.target.value)} placeholder="무엇을 챙길까요?" style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
              <button onClick={handleAddChecklist} style={{ padding: '8px 15px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>추가</button>
            </div>
          </div>

          <button onClick={() => setCurrentScreen('main')} style={{ padding: '10px', marginTop: '30px', width: '100%', backgroundColor: 'transparent', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>
            ← 메인으로 돌아가기
          </button>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', width: '88%', maxWidth: '360px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>

            <h2 style={{ margin: '0 0 15px 0', color: '#333', borderBottom: '2px solid #ffd43b', paddingBottom: '10px', textAlign: 'center', fontSize: '20px' }}>
              💸 정산 해요~ 💸
            </h2>

            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>📝 지출 내역</h3>
              {settlementData.dayExpenses.map(expense => (
                <div key={expense.id} style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                    {expense.desc} <strong>{expense.amount.toLocaleString()}원</strong> <span style={{ color: '#888', fontWeight: 'normal' }}>({expense.payer} 결제)</span>
                  </div>
                  {expense.splits && expense.splits.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                      → {expense.splits.map(s => `${s.name} ${s.amount.toLocaleString()}원`).join(' / ')}
                    </div>
                  )}
                </div>
              ))}
              {settlementData.dayExpenses.length === 0 && (
                <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>지출 내역이 없습니다.</p>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #dee2e6', margin: '12px 0' }} />

            <div style={{ marginBottom: '15px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>💰 정산 요약</h3>
              {settlementData.netBalances.map(person => (
                <div key={person.name} style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px', marginBottom: '4px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{person.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>결제: <strong>{person.paid.toLocaleString()}</strong>원</span>
                    <span>사용: <strong>{person.consumed.toLocaleString()}</strong>원</span>
                  </div>
                  <div style={{ marginTop: '3px', textAlign: 'right', fontWeight: 'bold', color: person.net > 0 ? '#2b8a3e' : person.net < 0 ? '#e03131' : '#888' }}>
                    {person.net > 0 ? `받아야 할 돈: ${person.net.toLocaleString()}원` : person.net < 0 ? `내야 할 돈: ${Math.abs(person.net).toLocaleString()}원` : '정산 완료'}
                  </div>
                </div>
              ))}
              {settlementData.netBalances.length === 0 && (
                <p style={{ fontSize: '13px', color: '#999', margin: 0 }}>정산할 내역이 없습니다.</p>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #dee2e6', margin: '12px 0' }} />

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057', borderBottom: '1px solid #dee2e6', paddingBottom: '5px' }}>💸 송금 가이드</h3>
              {settlementData.transfers.map((t, i) => (
                <div key={i} style={{ padding: '10px', backgroundColor: '#d3f9d8', borderRadius: '8px', marginBottom: '6px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#2b8a3e' }}>
                  {t.from} → {t.to}에게 {t.amount.toLocaleString()}원 송금
                </div>
              ))}
              {settlementData.transfers.length === 0 && settlementData.netBalances.length > 0 && (
                <p style={{ fontSize: '13px', color: '#999', margin: 0, textAlign: 'center' }}>정산이 완료되었습니다!</p>
              )}
              {settlementData.netBalances.length === 0 && (
                <p style={{ fontSize: '13px', color: '#999', margin: 0, textAlign: 'center' }}>정산할 내역이 없습니다.</p>
              )}
            </div>

            <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 30px', backgroundColor: '#e9ecef', border: 'none', borderRadius: '15px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;