import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/announcement.dart';
import '../providers/announcement_provider.dart';
import '../theme/app_theme.dart';

class AnnouncementsScreen extends StatefulWidget {
  /// When [embedded] is true, the screen is rendered inside the Dashboard
  /// tab body and should not show its own AppBar.
  final bool embedded;

  const AnnouncementsScreen({super.key, this.embedded = false});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AnnouncementProvider>().fetchAnnouncements();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.embedded) {
      return _buildBody();
    }
    return Scaffold(
      backgroundColor: AppTheme.bgCanvas,
      appBar: AppBar(
        title: const Text('Announcements'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded, color: AppTheme.primaryGreen),
            onPressed: () => context.read<AnnouncementProvider>().fetchAnnouncements(),
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    return Column(
      children: [
        if (widget.embedded) _buildEmbeddedHeader(),
        _buildSearchBar(),
        Expanded(child: _buildList()),
      ],
    );
  }

  Widget _buildEmbeddedHeader() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('Announcements', style: AppTheme.headingMedium),
                    SizedBox(height: 2),
                    Text(
                      'Official advisories from Barangay 133',
                      style: AppTheme.caption,
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: AppTheme.primaryGreen),
                onPressed: () =>
                    context.read<AnnouncementProvider>().fetchAnnouncements(),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: TextField(
        controller: _searchCtrl,
        decoration: InputDecoration(
          hintText: 'Search announcements...',
          hintStyle: const TextStyle(fontSize: 14, color: AppTheme.textHint),
          prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primaryGreen, size: 20),
          suffixIcon: _searchCtrl.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18, color: AppTheme.textMuted),
                  onPressed: () { _searchCtrl.clear(); setState(() {}); },
                )
              : null,
          filled: true,
          fillColor: AppTheme.bgCanvas,
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: const BorderSide(color: AppTheme.cardBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: const BorderSide(color: AppTheme.cardBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
            borderSide: const BorderSide(color: AppTheme.primaryGreen, width: 1.5),
          ),
        ),
        onChanged: (_) => setState(() {}),
      ),
    );
  }

  Widget _buildList() {
    return Consumer<AnnouncementProvider>(
      builder: (_, ap, __) {
        if (ap.loading) {
          return const Center(child: CircularProgressIndicator(color: AppTheme.primaryGreen));
        }
        if (ap.error != null) {
          return AppTheme.emptyState(
            icon: Icons.cloud_off_rounded,
            title: 'Failed to Load',
            subtitle: 'Could not fetch announcements. Please try again.',
            actionLabel: 'Retry',
            onAction: () => ap.fetchAnnouncements(),
          );
        }

        final query = _searchCtrl.text.trim().toLowerCase();
        final filtered = ap.announcements.where((a) {
          return a.title.toLowerCase().contains(query) ||
              a.content.toLowerCase().contains(query);
        }).toList();

        if (filtered.isEmpty) {
          return RefreshIndicator(
            color: AppTheme.primaryGreen,
            onRefresh: () => ap.fetchAnnouncements(),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                SizedBox(
                  height: MediaQuery.of(context).size.height * 0.45,
                  child: AppTheme.emptyState(
                    icon: Icons.campaign_outlined,
                    title: query.isEmpty ? 'No Announcements Yet' : 'No Results Found',
                    subtitle: query.isEmpty
                        ? 'Check back later for official news and updates.'
                        : 'Try a different search term.',
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          color: AppTheme.primaryGreen,
          onRefresh: () => ap.fetchAnnouncements(),
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
            itemCount: filtered.length,
            itemBuilder: (_, i) => _buildAnnouncementCard(context, filtered[i]),
          ),
        );
      },
    );
  }

  Widget _buildAnnouncementCard(BuildContext context, Announcement a) {
    final hasAttachment = a.attachmentPath != null && a.attachmentPath!.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: AppTheme.shadowSm,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(AppTheme.radiusLg),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppTheme.radiusLg),
          onTap: () => Navigator.pushNamed(
            context,
            '/announcement-detail',
            arguments: a,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Green accent top stripe
              Container(
                height: 4,
                decoration: BoxDecoration(
                  gradient: AppTheme.welcomeGradient,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(AppTheme.radiusLg),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        AppTheme.statusChip(
                          label: 'OFFICIAL ADVISORY',
                          color: AppTheme.primaryGreen,
                          icon: Icons.campaign_rounded,
                        ),
                        const Spacer(),
                        if (a.datePosted != null)
                          Row(
                            children: [
                              const Icon(
                                Icons.calendar_today_rounded,
                                size: 12,
                                color: AppTheme.textHint,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                _formatDate(a.datePosted!),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textHint,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      a.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textDark,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      a.content,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13.5,
                        color: AppTheme.textMuted,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        if (hasAttachment)
                          AppTheme.statusChip(
                            label: 'Attachment',
                            color: AppTheme.textMuted,
                            icon: Icons.attachment_rounded,
                          ),
                        const Spacer(),
                        const Text(
                          'Read full story',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryGreen,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 15,
                          color: AppTheme.primaryGreen,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(String date) {
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    const months = [
      '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final m = dt.month >= 1 && dt.month <= 12 ? months[dt.month] : '${dt.month}';
    return '$m ${dt.day}, ${dt.year}';
  }
}
