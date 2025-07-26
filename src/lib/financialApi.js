import { supabase } from './supabase';

// 재정 기록 관련 API 함수들

// 모든 재정 기록 조회
export const getFinancialRecords = async () => {
  try {
    const { data: records, error } = await supabase
      .from('financial_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 각 기록에 대해 프로필 정보를 별도로 조회
    const enrichedRecords = await Promise.all(
      (records || []).map(async (record) => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', record.recorded_by)
            .single();
          
          return {
            ...record,
            profiles: profile
          };
        } catch (profileErr) {
          return {
            ...record,
            profiles: { name: '익명' }
          };
        }
      })
    );

    return { data: enrichedRecords, error: null };
  } catch (error) {
    console.error('재정 기록 조회 오류:', error);
    return { data: [], error };
  }
};

// 재정 기록 생성
export const createFinancialRecord = async (recordData) => {
  try {
    const { data, error } = await supabase
      .from('financial_records')
      .insert({
        type: recordData.type, // 'income' or 'expense'
        amount: recordData.amount,
        description: recordData.description,
        category: recordData.category,
        recorded_by: recordData.recorded_by
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('재정 기록 생성 오류:', error);
    return { data: null, error };
  }
};

// 재정 기록 수정
export const updateFinancialRecord = async (recordId, recordData) => {
  try {
    const { data, error } = await supabase
      .from('financial_records')
      .update({
        type: recordData.type,
        amount: recordData.amount,
        description: recordData.description,
        category: recordData.category
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('재정 기록 수정 오류:', error);
    return { data: null, error };
  }
};

// 재정 기록 삭제
export const deleteFinancialRecord = async (recordId) => {
  try {
    const { error } = await supabase
      .from('financial_records')
      .delete()
      .eq('id', recordId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('재정 기록 삭제 오류:', error);
    return { error };
  }
};

// 재정 통계 조회 (총 수입, 총 지출, 잔액)
export const getFinancialSummary = async () => {
  try {
    const { data: records, error } = await supabase
      .from('financial_records')
      .select('type, amount');

    if (error) throw error;

    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      recordCount: records?.length || 0
    };

    if (records) {
      records.forEach(record => {
        if (record.type === 'income') {
          summary.totalIncome += record.amount;
        } else if (record.type === 'expense') {
          summary.totalExpense += record.amount;
        }
      });
      summary.balance = summary.totalIncome - summary.totalExpense;
    }

    return { data: summary, error: null };
  } catch (error) {
    console.error('재정 통계 조회 오류:', error);
    return { data: null, error };
  }
};

// 월별 재정 통계 조회
export const getMonthlyFinancialStats = async (year = new Date().getFullYear()) => {
  try {
    const { data: records, error } = await supabase
      .from('financial_records')
      .select('type, amount, created_at')
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`);

    if (error) throw error;

    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
      balance: 0
    }));

    if (records) {
      records.forEach(record => {
        const month = new Date(record.created_at).getMonth();
        if (record.type === 'income') {
          monthlyStats[month].income += record.amount;
        } else if (record.type === 'expense') {
          monthlyStats[month].expense += record.amount;
        }
      });

      // 잔액 계산
      monthlyStats.forEach(stat => {
        stat.balance = stat.income - stat.expense;
      });
    }

    return { data: monthlyStats, error: null };
  } catch (error) {
    console.error('월별 재정 통계 조회 오류:', error);
    return { data: [], error };
  }
};

// 참석 기록 관련 함수들

// 스터디 세션의 참석 기록 조회
export const getSessionAttendance = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .select(`
        *,
        profiles!session_attendance_user_id_fkey(name, email)
      `)
      .eq('session_id', sessionId);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('참석 기록 조회 오류:', error);
    return { data: [], error };
  }
};

// 참석 상태 업데이트
export const updateAttendanceStatus = async (sessionId, userId, status, absentFee = 0) => {
  try {
    const { data, error } = await supabase
      .from('session_attendance')
      .upsert({
        session_id: sessionId,
        user_id: userId,
        status: status, // 'present', 'absent', 'late'
        absent_fee: status === 'absent' ? absentFee : 0
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('참석 상태 업데이트 오류:', error);
    return { data: null, error };
  }
};

// 결석비 통계 조회
export const getAbsentFeeStats = async () => {
  try {
    const { data: attendance, error } = await supabase
      .from('session_attendance')
      .select(`
        status,
        absent_fee,
        profiles!session_attendance_user_id_fkey(name)
      `)
      .neq('absent_fee', 0);

    if (error) throw error;

    const stats = {
      totalAbsentFee: 0,
      absentCount: 0,
      memberStats: {}
    };

    if (attendance) {
      attendance.forEach(record => {
        stats.totalAbsentFee += record.absent_fee;
        if (record.status === 'absent') {
          stats.absentCount++;
        }

        const memberName = record.profiles?.name || '익명';
        if (!stats.memberStats[memberName]) {
          stats.memberStats[memberName] = {
            absentCount: 0,
            totalFee: 0
          };
        }
        if (record.status === 'absent') {
          stats.memberStats[memberName].absentCount++;
          stats.memberStats[memberName].totalFee += record.absent_fee;
        }
      });
    }

    return { data: stats, error: null };
  } catch (error) {
    console.error('결석비 통계 조회 오류:', error);
    return { data: null, error };
  }
};