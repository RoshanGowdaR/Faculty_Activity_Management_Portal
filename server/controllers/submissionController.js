const supabase = require('../config/db');
const path = require('path');

const uploadFileToSupabase = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${basename}-${uniqueSuffix}${ext}`;

  const { data, error } = await supabase.storage
    .from('proofs')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from('proofs')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

const deleteFileFromSupabase = async (url) => {
  try {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];

    const { error } = await supabase.storage
      .from('proofs')
      .remove([fileName]);
    
    if (error) {
      console.error('Error deleting file from Supabase storage:', error.message);
    }
  } catch (err) {
    console.error('Failed to parse file name for deletion:', err.message);
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { category, academic_year } = req.query;
    let query = supabase.from('submissions').select('*').eq('user_id', req.user.id);

    if (category) query = query.eq('category', category);
    if (academic_year) query = query.eq('academic_year', academic_year);

    const { data: list, error } = await query.order('submitted_at', { ascending: false });

    if (error) throw error;
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSubmission = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Supporting document file is required' });
    }

    const { category, title, academic_year, detail_fields } = req.body;

    let parsedDetails = {};
    if (detail_fields) {
      try {
        parsedDetails = typeof detail_fields === 'string' ? JSON.parse(detail_fields) : detail_fields;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid detail_fields JSON format' });
      }
    }

    const fileUrl = await uploadFileToSupabase(req.file);

    const { data: submission, error: createError } = await supabase
      .from('submissions')
      .insert([{
        user_id: req.user.id,
        category,
        title,
        academic_year,
        file_path: fileUrl,
        detail_fields: parsedDetails,
        status: 'pending'
      }])
      .select()
      .single();

    if (createError) throw createError;

    await supabase.from('notifications').insert([{
      user_id: req.user.id,
      message: `Submission received successfully: "${title}" (${category})`
    }]);

    await supabase.from('audit_logs').insert([{
      action: 'Create Submission',
      target: `Submission "${title}" (ID: ${submission.id})`,
      user_id: req.user.id
    }]);

    res.status(201).json({
      message: 'Submission created successfully',
      submission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    const { data: submission, error: findError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this submission' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Verified or rejected submissions cannot be modified' });
    }

    const { category, title, academic_year, detail_fields } = req.body;

    const updatePayload = {
      category: category || submission.category,
      title: title || submission.title,
      academic_year: academic_year || submission.academic_year
    };

    if (detail_fields) {
      try {
        updatePayload.detail_fields = typeof detail_fields === 'string' ? JSON.parse(detail_fields) : detail_fields;
      } catch (e) {
        return res.status(400).json({ message: 'Invalid detail_fields JSON format' });
      }
    }

    if (req.file) {
      await deleteFileFromSupabase(submission.file_path);
      const fileUrl = await uploadFileToSupabase(req.file);
      updatePayload.file_path = fileUrl;
    }

    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await supabase.from('audit_logs').insert([{
      action: 'Update Submission',
      target: `Submission "${submission.title}" (ID: ${submission.id})`,
      user_id: req.user.id
    }]);

    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const { data: submission, error: findError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (findError || !submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this submission' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Verified or rejected submissions cannot be deleted' });
    }

    await deleteFileFromSupabase(submission.file_path);

    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    await supabase.from('audit_logs').insert([{
      action: 'Delete Submission',
      target: `Submission "${submission.title}" (ID: ${submission.id})`,
      user_id: req.user.id
    }]);

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
