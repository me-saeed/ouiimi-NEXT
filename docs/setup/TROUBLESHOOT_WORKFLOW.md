# Troubleshooting GitHub Actions Workflow

## Why Workflow Shows "Failure" with 0s Duration

This usually means the workflow failed **before** it could start running jobs. Common causes:

### 1. Missing Required Secrets

The `deploy` job requires these secrets. If any are missing, the workflow will fail immediately:

**Required Secrets:**
- ✅ `DO_SSH_PRIVATE_KEY` - SSH key for VPS access
- ✅ `DO_HOST` - Your VPS IP address
- ✅ `DO_USER` - Usually `root`
- ✅ `DO_APP_PATH` - Usually `/root/ouiimi`

**Check if secrets are set:**
1. Go to: **GitHub Repository → Settings → Secrets and variables → Actions**
2. Verify all required secrets exist
3. Make sure they're spelled correctly (case-sensitive!)

### 2. Workflow File Syntax Error

**Check the workflow file:**
1. Go to: **GitHub Repository → Actions tab**
2. Click on the failed workflow run
3. Look for any red error messages at the top
4. Common errors:
   - YAML syntax errors (indentation, quotes)
   - Invalid job dependencies
   - Missing required fields

### 3. View Detailed Error Logs

**To see what actually failed:**

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Click on the failed workflow run (the one showing "Failure")
4. Look for any error messages in red
5. Expand any failed steps to see detailed logs

### 4. Check Workflow Permissions

**If workflow can't access secrets:**

1. Go to: **Settings → Actions → General**
2. Under "Workflow permissions", ensure:
   - ✅ "Read and write permissions" is selected
   - ✅ "Allow GitHub Actions to create and approve pull requests" is checked

### 5. Test Job Dependencies

The `deploy` job depends on `test` and `build` jobs. If either fails, deploy won't run:

**Check:**
1. Did the `test` job pass?
2. Did the `build` job pass?
3. If either failed, fix those first

### 6. Quick Fix Checklist

- [ ] All required secrets are set in GitHub
- [ ] Secret names match exactly (case-sensitive)
- [ ] Workflow file has no syntax errors
- [ ] `test` job passes
- [ ] `build` job passes
- [ ] Workflow permissions are correct

### 7. Common Error Messages

**"Resource not accessible by integration"**
→ Workflow permissions issue (see #4 above)

**"Secret not found"**
→ Missing secret (see #1 above)

**"Invalid YAML"**
→ Syntax error in workflow file

**"Job skipped"**
→ Previous job failed or condition not met

### 8. How to Debug

**Enable debug logging:**

1. Go to: **Settings → Secrets and variables → Actions**
2. Add a new secret: `ACTIONS_STEP_DEBUG` = `true`
3. Add another secret: `ACTIONS_RUNNER_DEBUG` = `true`
4. Re-run the workflow
5. Check logs for detailed debug output

### 9. Manual Test

**Test the workflow file locally:**

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test workflow (dry run)
act push --dry-run
```

### 10. Still Not Working?

**Check GitHub Actions status page:**
- https://www.githubstatus.com/
- Sometimes GitHub Actions has outages

**Check repository settings:**
- Make sure Actions are enabled
- Go to: **Settings → Actions → General**
- Ensure "Allow all actions and reusable workflows" is selected

