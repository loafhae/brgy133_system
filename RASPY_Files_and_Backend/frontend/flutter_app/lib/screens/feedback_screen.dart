import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/feedback_model.dart';
import '../providers/feedback_provider.dart';
import '../theme/app_theme.dart';

class FeedbackScreen extends StatefulWidget {
  /// When [embedded] is true, the screen renders inside the Dashboard tab body.
  final bool embedded;

  const FeedbackScreen({super.key, this.embedded = false});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final _subjectCtrl  = TextEditingController();
  final _contentCtrl  = TextEditingController();
  final _formKey      = GlobalKey<FormState>();
  List<PlatformFile> _attachments  = [];
  String? _selectedCategory;

  final List<Map<String, dynamic>> _quickCategories = [
    {'title': 'Sanitation / Waste',       'icon': Icons.delete_outline_rounded},
    {'title': 'Noise / Peace & Order',    'icon': Icons.volume_off_rounded},
    {'title': 'Public Facilities',        'icon': Icons.handyman_rounded},
    {'title': 'General Suggestion',       'icon': Icons.lightbulb_outline_rounded},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FeedbackProvider>().fetchMyFeedback();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _subjectCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  void _selectCategory(String cat) {
    setState(() {
      _selectedCategory = cat;
      _subjectCtrl.text = cat;
    });
  }

  Future<void> _pickAttachments() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        allowMultiple: true,
        withData: true,
      );
      if (result != null && mounted) {
        final oversized = result.files.where((f) => f.size > 10 * 1024 * 1024);
        final accepted  = result.files.where((f) => f.size <= 10 * 1024 * 1024).toList();
        final slots     = 10 - _attachments.length;
        if (oversized.isNotEmpty || accepted.length > slots) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Max 10 files, each up to 10 MB.'),
              backgroundColor: AppTheme.primaryGreen,
            ),
          );
        }
        setState(() => _attachments = [..._attachments, ...accepted.take(slots)]);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to select file: $e')),
      );
    }
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        ),
        title: const Row(
          children: [
            Icon(Icons.send_rounded, color: AppTheme.primaryGreen, size: 22),
            SizedBox(width: 8),
            Text('Confirm Submission',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
          ],
        ),
        content: const Text(
          'Submit this concern to Barangay 133 administration?',
          style: TextStyle(fontSize: 14, color: AppTheme.textBody),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              ),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final fp = context.read<FeedbackProvider>();
              final ok = await fp.submitFeedback(
                _subjectCtrl.text.trim(),
                _contentCtrl.text.trim(),
                _attachments,
              );
              if (!mounted) return;
              if (ok) {
                _subjectCtrl.clear();
                _contentCtrl.clear();
                setState(() { _attachments = []; _selectedCategory = null; });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Feedback submitted successfully!'),
                    backgroundColor: AppTheme.primaryGreen,
                  ),
                );
                _tabController.animateTo(1);
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  String _formatDate(String? raw) {
    if (raw == null || raw.isEmpty) return '';
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) return raw;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final hour   = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final minute = dt.minute.toString().padLeft(2, '0');
    final ampm   = dt.hour >= 12 ? 'PM' : 'AM';
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year} • $hour:$minute $ampm';
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) {
      return _buildEmbeddedBody();
    }
    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      appBar: AppBar(
        title: const Text('Feedback & Concerns'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(icon: Icon(Icons.edit_note_rounded, size: 20), text: 'Submit'),
                  Tab(icon: Icon(Icons.mark_chat_read_rounded, size: 20), text: 'My Concerns'),
                ],
              ),
              const Divider(height: 1),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_buildSubmitTab(), _buildMyConcernsTab()],
      ),
    );
  }

  /// Embedded in Dashboard bottom-nav — shows both tabs inside a column
  Widget _buildEmbeddedBody() {
    return Column(
      children: [
        // Embedded header
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text('Feedback & Concerns', style: AppTheme.headingMedium),
              SizedBox(height: 2),
              Text('Submit issues or suggestions to barangay leadership', style: AppTheme.caption),
              SizedBox(height: 12),
            ],
          ),
        ),
        // Tab bar
        Container(
          color: Colors.white,
          child: Column(
            children: [
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(icon: Icon(Icons.edit_note_rounded, size: 20), text: 'Submit'),
                  Tab(icon: Icon(Icons.mark_chat_read_rounded, size: 20), text: 'My Concerns'),
                ],
              ),
              const Divider(height: 1),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [_buildSubmitTab(), _buildMyConcernsTab()],
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(18),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppTheme.welcomeGradient,
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                boxShadow: AppTheme.shadowGreen,
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.support_agent_rounded, color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Resident Assistance Desk',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Send concerns or suggestions directly to barangay officials.',
                          style: TextStyle(color: Colors.white70, fontSize: 12.5, height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Submission error
            Consumer<FeedbackProvider>(
              builder: (_, fp, __) {
                if (fp.error == null) return const SizedBox.shrink();
                return AppTheme.errorBanner(fp.error!);
              },
            ),

            // Category chips
            const Text('Category (Optional)', style: AppTheme.labelLarge),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _quickCategories.map((cat) {
                final title    = cat['title'] as String;
                final icon     = cat['icon'] as IconData;
                final selected = _selectedCategory == title;
                return GestureDetector(
                  onTap: () => _selectCategory(title),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: selected ? AppTheme.primaryGreen : Colors.white,
                      borderRadius: BorderRadius.circular(AppTheme.radiusFull),
                      border: Border.all(
                        color: selected ? AppTheme.primaryGreen : AppTheme.cardBorder,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          icon,
                          size: 15,
                          color: selected ? Colors.white : AppTheme.textMuted,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          title,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                            color: selected ? Colors.white : AppTheme.textDark,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 18),

            // Subject
            const Text('Subject', style: AppTheme.labelLarge),
            const SizedBox(height: 6),
            TextFormField(
              controller: _subjectCtrl,
              decoration: AppTheme.inputDecoration(
                label: '',
                hint: 'e.g., Uncollected trash near Mabini St.',
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Subject is required' : null,
            ),
            const SizedBox(height: 16),

            // Message
            const Text('Message / Concern Details', style: AppTheme.labelLarge),
            const SizedBox(height: 6),
            TextFormField(
              controller: _contentCtrl,
              maxLines: 5,
              decoration: AppTheme.inputDecoration(
                label: '',
                hint: 'Describe the issue including date, time, and location...',
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Please provide details' : null,
            ),
            const SizedBox(height: 18),

            // Attachment picker
            const Text('Attachments (Optional)', style: AppTheme.labelLarge),
            const SizedBox(height: 8),
            InkWell(
              borderRadius: BorderRadius.circular(AppTheme.radiusMd),
              onTap: _pickAttachments,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                  border: Border.all(color: AppTheme.cardBorder),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.add_photo_alternate_rounded, color: AppTheme.primaryGreen, size: 24),
                    SizedBox(height: 6),
                    Text(
                      'Add Photos or PDF',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primaryGreen,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Up to 10 files · Max 10 MB each',
                      style: TextStyle(fontSize: 11.5, color: AppTheme.textHint),
                    ),
                  ],
                ),
              ),
            ),
            if (_attachments.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  for (var i = 0; i < _attachments.length; i++)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.cardBorder),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.attach_file_rounded, size: 13, color: AppTheme.textMuted),
                          const SizedBox(width: 5),
                          ConstrainedBox(
                            constraints: const BoxConstraints(maxWidth: 140),
                            child: Text(
                              _attachments[i].name,
                              style: const TextStyle(fontSize: 12, color: AppTheme.textDark),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 5),
                          GestureDetector(
                            onTap: () => setState(() => _attachments.removeAt(i)),
                            child: const Icon(Icons.close_rounded, size: 14, color: AppTheme.textHint),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 24),

            // Submit button
            Consumer<FeedbackProvider>(
              builder: (_, fp, __) => SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppTheme.radiusMd),
                    ),
                  ),
                  onPressed: fp.submitting ? null : _submit,
                  icon: fp.submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send_rounded, size: 18),
                  label: Text(
                    fp.submitting ? 'Submitting...' : 'SUBMIT REPORT',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildMyConcernsTab() {
    return Consumer<FeedbackProvider>(
      builder: (context, fp, __) {
        if (fp.loading) {
          return const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen));
        }
        if (fp.feedbacks.isEmpty) {
          return RefreshIndicator(
            color: AppTheme.primaryGreen,
            onRefresh: () => fp.fetchMyFeedback(),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 40),
                AppTheme.emptyState(
                  icon: Icons.mark_chat_read_rounded,
                  title: 'No Submitted Concerns Yet',
                  subtitle: "You haven't submitted any reports yet. Use the Submit tab to send one.",
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () => fp.fetchMyFeedback(),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: fp.feedbacks.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _buildFeedbackCard(fp.feedbacks[i]),
          ),
        );
      },
    );
  }

  Widget _buildFeedbackCard(FeedbackModel item) {
    final resolved = item.isResolved;
    final statusColor  = resolved ? AppTheme.successGreen  : AppTheme.warningAmber;
    final statusBg     = resolved ? AppTheme.successLight   : AppTheme.warningLight;
    final statusIcon   = resolved ? Icons.check_circle_rounded : Icons.schedule_rounded;
    final statusLabel  = resolved ? 'Resolved' : 'Pending Review';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.5),
          width: 1.2,
        ),
        boxShadow: AppTheme.shadowSm,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppTheme.statusChip(
                label: statusLabel,
                color: statusColor,
                bgColor: statusBg,
                icon: statusIcon,
              ),
              const Spacer(),
              Text(
                _formatDate(item.timestamp),
                style: const TextStyle(fontSize: 11, color: AppTheme.textHint),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item.subject,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppTheme.textDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            item.content,
            style: const TextStyle(fontSize: 13.5, color: AppTheme.textBody, height: 1.45),
          ),
          if (item.attachments.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: item.attachments.map((att) {
                final isPdf = att.mimeType.contains('pdf');
                return AppTheme.statusChip(
                  label: att.originalFilename,
                  color: AppTheme.primaryGreen,
                  icon: isPdf ? Icons.picture_as_pdf_rounded : Icons.image_rounded,
                );
              }).toList(),
            ),
          ],
          if (resolved && item.resolvedAt != null) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.successLight,
                borderRadius: BorderRadius.circular(AppTheme.radiusSm),
                border: Border.all(color: AppTheme.successGreen.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_rounded, color: AppTheme.successGreen, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Action completed on ${_formatDate(item.resolvedAt)}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.successGreen,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
