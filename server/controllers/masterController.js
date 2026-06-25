const supabase = require('../config/db');

// Departments
exports.getDepartments = async (req, res) => {
  try {
    const { data: list, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const { data: exists, error: checkError } = await supabase
      .from('departments')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (checkError) throw checkError;
    if (exists) return res.status(400).json({ message: 'Department already exists' });

    const { data: doc, error: insertError } = await supabase
      .from('departments')
      .insert([{ name }])
      .select()
      .single();

    if (insertError) throw insertError;

    await supabase.from('audit_logs').insert([{
      action: 'Create Department',
      target: name,
      user_id: req.user.id
    }]);

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { data: doc, error: getError } = await supabase
      .from('departments')
      .select('name')
      .eq('id', req.params.id)
      .single();

    if (getError || !doc) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const { error: deleteError } = await supabase
      .from('departments')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    await supabase.from('audit_logs').insert([{
      action: 'Delete Department',
      target: doc.name,
      user_id: req.user.id
    }]);

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Designations
exports.getDesignations = async (req, res) => {
  try {
    const { data: list, error } = await supabase
      .from('designations')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const { data: exists, error: checkError } = await supabase
      .from('designations')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (checkError) throw checkError;
    if (exists) return res.status(400).json({ message: 'Designation already exists' });

    const { data: doc, error: insertError } = await supabase
      .from('designations')
      .insert([{ name }])
      .select()
      .single();

    if (insertError) throw insertError;

    await supabase.from('audit_logs').insert([{
      action: 'Create Designation',
      target: name,
      user_id: req.user.id
    }]);

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteDesignation = async (req, res) => {
  try {
    const { data: doc, error: getError } = await supabase
      .from('designations')
      .select('name')
      .eq('id', req.params.id)
      .single();

    if (getError || !doc) {
      return res.status(404).json({ message: 'Designation not found' });
    }

    const { error: deleteError } = await supabase
      .from('designations')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    await supabase.from('audit_logs').insert([{
      action: 'Delete Designation',
      target: doc.name,
      user_id: req.user.id
    }]);

    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Categories
exports.getCategories = async (req, res) => {
  try {
    const { data: list, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const { data: exists, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (checkError) throw checkError;
    if (exists) return res.status(400).json({ message: 'Category already exists' });

    const { data: doc, error: insertError } = await supabase
      .from('categories')
      .insert([{ name }])
      .select()
      .single();

    if (insertError) throw insertError;

    await supabase.from('audit_logs').insert([{
      action: 'Create Category',
      target: name,
      user_id: req.user.id
    }]);

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { data: doc, error: getError } = await supabase
      .from('categories')
      .select('name')
      .eq('id', req.params.id)
      .single();

    if (getError || !doc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;

    await supabase.from('audit_logs').insert([{
      action: 'Delete Category',
      target: doc.name,
      user_id: req.user.id
    }]);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
