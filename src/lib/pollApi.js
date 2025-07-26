import { supabase } from './supabase';

// 투표 관련 API 함수들

// 모든 투표 조회
export const getPolls = async () => {
  try {
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;

    // 각 투표에 대해 옵션과 투표 참여 데이터 조회
    const enrichedPolls = await Promise.all(
      polls.map(async (poll) => {
        // 투표 옵션 조회
        const { data: options } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', poll.id)
          .order('created_at', { ascending: true });

        // 투표 참여 데이터 조회 (옵션별 투표 수 계산)
        const optionsWithVotes = await Promise.all(
          (options || []).map(async (option) => {
            try {
              // 투표 수만 먼저 조회
              const { data: votes, error } = await supabase
                .from('poll_votes')
                .select('id, user_id')
                .eq('option_id', option.id);

              if (error) {
                console.error(`옵션 ${option.id} 투표 조회 오류:`, error);
                return {
                  ...option,
                  votes: [],
                  vote_count: 0
                };
              }

              // 투표자 이름 정보를 별도로 조회
              const votesWithNames = await Promise.all(
                (votes || []).map(async (vote) => {
                  try {
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('name')
                      .eq('id', vote.user_id)
                      .single();
                    
                    return {
                      ...vote,
                      profiles: profile
                    };
                  } catch (profileErr) {
                    return {
                      ...vote,
                      profiles: { name: '익명' }
                    };
                  }
                })
              );

              return {
                ...option,
                votes: votesWithNames,
                vote_count: (votes || []).length
              };
            } catch (err) {
              console.error(`옵션 ${option.id} 처리 오류:`, err);
              return {
                ...option,
                votes: [],
                vote_count: 0
              };
            }
          })
        );

        // 생성자 정보 조회
        const { data: creator } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', poll.created_by)
          .single();

        return {
          ...poll,
          options: optionsWithVotes,
          created_by_profile: creator,
          total_votes: optionsWithVotes.reduce((sum, option) => sum + option.vote_count, 0)
        };
      })
    );

    return { data: enrichedPolls, error: null };
  } catch (error) {
    console.error('투표 조회 오류:', error);
    return { data: null, error };
  }
};

// 특정 투표 조회
export const getPoll = async (pollId) => {
  try {
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) throw pollError;

    // 투표 옵션 조회
    const { data: options } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('created_at', { ascending: true });

    // 각 옵션별 투표 데이터 조회
    const optionsWithVotes = await Promise.all(
      (options || []).map(async (option) => {
        try {
          // 투표 수만 먼저 조회
          const { data: votes, error } = await supabase
            .from('poll_votes')
            .select('id, user_id')
            .eq('option_id', option.id);

          if (error) {
            console.error(`옵션 ${option.id} 투표 조회 오류:`, error);
            return {
              ...option,
              votes: [],
              vote_count: 0
            };
          }

          // 투표자 이름 정보를 별도로 조회
          const votesWithNames = await Promise.all(
            (votes || []).map(async (vote) => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('name')
                  .eq('id', vote.user_id)
                  .single();
                
                return {
                  ...vote,
                  profiles: profile
                };
              } catch (profileErr) {
                return {
                  ...vote,
                  profiles: { name: '익명' }
                };
              }
            })
          );

          return {
            ...option,
            votes: votesWithNames,
            vote_count: (votes || []).length
          };
        } catch (err) {
          console.error(`옵션 ${option.id} 처리 오류:`, err);
          return {
            ...option,
            votes: [],
            vote_count: 0
          };
        }
      })
    );

    // 생성자 정보 조회
    const { data: creator } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', poll.created_by)
      .single();

    return {
      data: {
        ...poll,
        options: optionsWithVotes,
        created_by_profile: creator,
        total_votes: optionsWithVotes.reduce((sum, option) => sum + option.vote_count, 0)
      },
      error: null
    };
  } catch (error) {
    console.error('투표 조회 오류:', error);
    return { data: null, error };
  }
};

// 투표 생성
export const createPoll = async (pollData) => {
  try {
    // 투표 생성
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description,
        poll_type: pollData.poll_type,
        multiple_choice: pollData.multiple_choice || false,
        created_by: pollData.created_by,
        closes_at: pollData.closes_at
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // 투표 옵션들 생성
    if (pollData.options && pollData.options.length > 0) {
      const optionsToInsert = pollData.options.map(option => ({
        poll_id: poll.id,
        option_text: option.text,
        option_data: option.data || null
      }));

      const { error: optionsError } = await supabase
        .from('poll_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;
    }

    return { data: poll, error: null };
  } catch (error) {
    console.error('투표 생성 오류:', error);
    return { data: null, error };
  }
};

// 투표 참여
export const votePoll = async (pollId, optionId, userId) => {
  try {
    // 이미 투표했는지 확인
    const { data: existingVote } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      // 기존 투표 변경
      const { error } = await supabase
        .from('poll_votes')
        .update({ option_id: optionId })
        .eq('id', existingVote.id);

      if (error) throw error;
    } else {
      // 새 투표 추가
      const { error } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          option_id: optionId,
          user_id: userId
        });

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('투표 참여 오류:', error);
    return { error };
  }
};

// 투표 취소
export const cancelVote = async (pollId, userId) => {
  try {
    const { error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('투표 취소 오류:', error);
    return { error };
  }
};

// 투표 마감
export const closePoll = async (pollId) => {
  try {
    const { error } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('id', pollId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('투표 마감 오류:', error);
    return { error };
  }
};

// 투표 삭제
export const deletePoll = async (pollId) => {
  try {
    // 관련 데이터들이 CASCADE로 자동 삭제됨
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('투표 삭제 오류:', error);
    return { error };
  }
};

// 투표 수정
export const updatePoll = async (pollId, pollData) => {
  try {
    const { data, error } = await supabase
      .from('polls')
      .update({
        title: pollData.title,
        description: pollData.description,
        closes_at: pollData.closes_at,
        status: pollData.status
      })
      .eq('id', pollId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('투표 수정 오류:', error);
    return { data: null, error };
  }
};

// 사용자가 특정 투표에 참여했는지 확인
export const getUserVote = async (pollId, userId) => {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data: data?.option_id || null, error: null };
  } catch (error) {
    console.error('사용자 투표 확인 오류:', error);
    return { data: null, error };
  }
};